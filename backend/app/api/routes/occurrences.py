from typing import Annotated, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_optional_user, utc_now
from app.db.session import get_session
from app.models import (
    Occurrence,
    OccurrenceComplaint,
    OccurrenceContribution,
    OccurrenceType,
    User,
)
from app.repositories import occurrences as repository
from app.schemas.occurrence import (
    ComplaintRequest,
    ContributionRequest,
    ContributionResponse,
    OccurrenceCreateRequest,
    OccurrencePage,
    OccurrenceRead,
    OccurrenceTypeRead,
    OccurrenceUpdateRequest,
    ReportRead,
)
from app.services.occurrences import (
    current_cutoff,
    decode_photo,
    to_public,
    to_report,
    validate_blumenau_point,
)

router = APIRouter(tags=["Ocorrências"])
Database = Annotated[Session, Depends(get_session)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def parse_bbox(value: str) -> tuple[float, float, float, float]:
    try:
        west, south, east, north = [float(part) for part in value.split(",")]
        if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=422, detail="bbox deve ser oeste,sul,leste,norte válidos.")
    return west, south, east, north


def _enrich_public_occurrences(
    session: Session, rows: list[Occurrence], viewer: User | None
) -> list[OccurrenceRead]:
    if not rows:
        return []
    ids = [row.id for row in rows]
    counts: dict[str, dict[str, int]] = {oid: {"confirmed": 0, "resolved": 0} for oid in ids}
    for oid, kind, total in session.execute(
        select(
            OccurrenceContribution.occurrence_id,
            OccurrenceContribution.kind,
            func.count(OccurrenceContribution.id),
        )
        .where(OccurrenceContribution.occurrence_id.in_(ids))
        .group_by(OccurrenceContribution.occurrence_id, OccurrenceContribution.kind)
    ):
        counts[oid][kind] = int(total)

    viewer_confirmed: set[str] = set()
    viewer_resolved: set[str] = set()
    viewer_complained: set[str] = set()
    if viewer is not None:
        for oid, kind in session.execute(
            select(OccurrenceContribution.occurrence_id, OccurrenceContribution.kind).where(
                OccurrenceContribution.occurrence_id.in_(ids),
                OccurrenceContribution.user_id == viewer.id,
            )
        ):
            if kind == "confirmed":
                viewer_confirmed.add(oid)
            elif kind == "resolved":
                viewer_resolved.add(oid)
        viewer_complained = set(
            session.scalars(
                select(OccurrenceComplaint.occurrence_id).where(
                    OccurrenceComplaint.occurrence_id.in_(ids),
                    OccurrenceComplaint.user_id == viewer.id,
                )
            )
        )

    return [
        to_public(
            row,
            confirmations_count=counts[row.id]["confirmed"],
            resolutions_count=counts[row.id]["resolved"],
            viewer_confirmed=row.id in viewer_confirmed,
            viewer_resolved=row.id in viewer_resolved,
            viewer_complained=row.id in viewer_complained,
        )
        for row in rows
    ]


@router.get("/occurrence-types", response_model=list[OccurrenceTypeRead])
def occurrence_types(session: Database):
    return repository.list_types(session)


@router.get("/occurrences", response_model=OccurrencePage)
def occurrences(
    session: Database,
    viewer: OptionalUser,
    bbox: str = "-49.15,-27.00,-48.98,-26.82",
    status: Literal["active", "resolved"] = "active",
    freshness: Literal["current", "expired", "all"] = "current",
    type_id: Annotated[int | None, Query(ge=1)] = None,
    cursor: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    rows = repository.list_public(
        session,
        bbox=parse_bbox(bbox),
        status=status,
        freshness=freshness,
        cutoff=current_cutoff(),
        type_id=type_id,
        cursor=str(cursor) if cursor else None,
        limit=limit,
    )
    has_more = len(rows) > limit
    rows = rows[:limit]
    return OccurrencePage(
        items=_enrich_public_occurrences(session, rows, viewer),
        next_cursor=rows[-1].id if has_more else None,
        has_more=has_more,
    )


@router.get("/occurrences/{occurrence_id}", response_model=OccurrenceRead)
def occurrence_detail(occurrence_id: UUID, session: Database, viewer: OptionalUser):
    occurrence = repository.get_public(session, str(occurrence_id))
    if occurrence is None:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    return _enrich_public_occurrences(session, [occurrence], viewer)[0]


@router.get("/occurrences/{occurrence_id}/photo")
def occurrence_photo(occurrence_id: UUID, session: Database, viewer: OptionalUser):
    occurrence = session.get(Occurrence, str(occurrence_id))
    if occurrence is None or not occurrence.photo_content_type:
        raise HTTPException(status_code=404, detail="Foto não encontrada.")
    is_public = occurrence.moderation_status == "approved" and occurrence.published_at is not None
    is_owner = viewer is not None and occurrence.user_id == viewer.id
    is_mod = viewer is not None and viewer.role == "moderator"
    if not (is_public or is_owner or is_mod):
        raise HTTPException(status_code=404, detail="Foto não encontrada.")
    photo_bytes = occurrence.photo_data
    if not photo_bytes:
        raise HTTPException(status_code=404, detail="Foto não encontrada.")
    return Response(
        content=photo_bytes,
        media_type=occurrence.photo_content_type,
        headers={"Cache-Control": "private, max-age=300"},
    )


@router.post("/occurrences", response_model=ReportRead, status_code=201)
def create_occurrence(payload: OccurrenceCreateRequest, user: CurrentUser, session: Database):
    validate_blumenau_point(payload.latitude, payload.longitude)
    occ_type = session.scalar(
        select(OccurrenceType).where(
            OccurrenceType.id == payload.type_id, OccurrenceType.enabled.is_(True)
        )
    )
    if occ_type is None:
        raise HTTPException(status_code=422, detail="Tipo de ocorrência inválido.")
    photo_bytes, photo_content_type = decode_photo(payload.photo_base64, payload.photo_content_type)
    now = utc_now()
    occurrence = Occurrence(
        id=str(uuid4()),
        user_id=user.id,
        type_id=occ_type.id,
        description=payload.description,
        place_name=payload.place_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        status="active",
        moderation_status="pending",
        source="community",
        is_simulated=False,
        photo_data=photo_bytes,
        photo_content_type=photo_content_type,
        created_at=now,
        updated_at=now,
    )
    session.add(occurrence)
    session.commit()
    session.refresh(occurrence)
    return to_report(occurrence)


@router.get("/me/occurrences", response_model=list[ReportRead])
def my_occurrences(user: CurrentUser, session: Database):
    rows = list(
        session.scalars(
            select(Occurrence)
            .where(Occurrence.user_id == user.id)
            .order_by(Occurrence.created_at.desc())
        )
    )
    return [to_report(row) for row in rows]


@router.put("/me/occurrences/{occurrence_id}", response_model=ReportRead)
def update_my_occurrence(
    occurrence_id: UUID,
    payload: OccurrenceUpdateRequest,
    user: CurrentUser,
    session: Database,
):
    occurrence = session.get(Occurrence, str(occurrence_id))
    if occurrence is None or occurrence.user_id != user.id:
        raise HTTPException(status_code=404, detail="Relato não encontrado.")
    if occurrence.moderation_status != "revision":
        raise HTTPException(
            status_code=409,
            detail="Somente relatos com correção solicitada podem ser editados.",
        )
    validate_blumenau_point(payload.latitude, payload.longitude)
    occ_type = session.scalar(
        select(OccurrenceType).where(
            OccurrenceType.id == payload.type_id, OccurrenceType.enabled.is_(True)
        )
    )
    if occ_type is None:
        raise HTTPException(status_code=422, detail="Tipo de ocorrência inválido.")
    occurrence.type_id = occ_type.id
    occurrence.description = payload.description
    occurrence.place_name = payload.place_name
    occurrence.latitude = payload.latitude
    occurrence.longitude = payload.longitude
    occurrence.moderation_status = "pending"
    occurrence.moderation_reason = None
    if payload.photo_base64:
        photo_bytes, photo_content_type = decode_photo(
            payload.photo_base64, payload.photo_content_type
        )
        occurrence.photo_data = photo_bytes
        occurrence.photo_content_type = photo_content_type
    elif payload.remove_photo:
        occurrence.photo_data = None
        occurrence.photo_content_type = None
    occurrence.updated_at = utc_now()
    session.commit()
    session.refresh(occurrence)
    return to_report(occurrence)


@router.post("/occurrences/{occurrence_id}/contributions", response_model=ContributionResponse)
def contribute_occurrence(
    occurrence_id: UUID,
    payload: ContributionRequest,
    user: CurrentUser,
    session: Database,
):
    occurrence = repository.get_public(session, str(occurrence_id))
    if occurrence is None:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    if occurrence.status != "active":
        raise HTTPException(status_code=409, detail="Esta ocorrência já está resolvida.")

    existing = session.scalar(
        select(OccurrenceContribution).where(
            OccurrenceContribution.occurrence_id == occurrence.id,
            OccurrenceContribution.user_id == user.id,
            OccurrenceContribution.kind == payload.kind,
        )
    )
    now = utc_now()
    if existing is None:
        session.add(
            OccurrenceContribution(
                id=str(uuid4()),
                occurrence_id=occurrence.id,
                user_id=user.id,
                kind=payload.kind,
                created_at=now,
            )
        )
        if payload.kind == "confirmed":
            occurrence.last_confirmed_at = now
            occurrence.updated_at = now
        session.flush()

    confirmed_count = int(
        session.scalar(
            select(func.count(OccurrenceContribution.id)).where(
                OccurrenceContribution.occurrence_id == occurrence.id,
                OccurrenceContribution.kind == "confirmed",
            )
        )
        or 0
    )
    resolved_count = int(
        session.scalar(
            select(func.count(OccurrenceContribution.id)).where(
                OccurrenceContribution.occurrence_id == occurrence.id,
                OccurrenceContribution.kind == "resolved",
            )
        )
        or 0
    )
    if payload.kind == "resolved" and resolved_count >= 2:
        occurrence.status = "resolved"
        occurrence.updated_at = now

    session.commit()
    viewer_kinds = set(
        session.scalars(
            select(OccurrenceContribution.kind).where(
                OccurrenceContribution.occurrence_id == occurrence.id,
                OccurrenceContribution.user_id == user.id,
            )
        )
    )
    return ContributionResponse(
        status=occurrence.status,
        confirmations_count=confirmed_count,
        resolutions_count=resolved_count,
        viewer_confirmed="confirmed" in viewer_kinds,
        viewer_resolved="resolved" in viewer_kinds,
    )


@router.post("/occurrences/{occurrence_id}/complaints", status_code=201)
def complain_occurrence(
    occurrence_id: UUID,
    payload: ComplaintRequest,
    user: CurrentUser,
    session: Database,
):
    occurrence = repository.get_public(session, str(occurrence_id))
    if occurrence is None:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    existing = session.scalar(
        select(OccurrenceComplaint).where(
            OccurrenceComplaint.occurrence_id == occurrence.id,
            OccurrenceComplaint.user_id == user.id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Você já enviou uma denúncia para este relato.")
    session.add(
        OccurrenceComplaint(
            id=str(uuid4()),
            occurrence_id=occurrence.id,
            user_id=user.id,
            reason=payload.reason,
            reviewed=False,
            created_at=utc_now(),
        )
    )
    session.commit()
    return {"status": "ok"}
