from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import require_moderator, utc_now
from app.db.session import get_session
from app.models import (
    ModerationDecision,
    Notification,
    Occurrence,
    OccurrenceComplaint,
    OccurrenceContribution,
    User,
    UserPreference,
)
from app.schemas.occurrence import (
    LocationUpdateRequest,
    ModerationComplaintRead,
    ModerationDecisionRead,
    ModerationQueueResponse,
    ModerationReviewRequest,
    ModeratorAddRequest,
    ModeratorRead,
    OccurrenceRead,
    ResolutionDecisionRequest,
)
from app.services.occurrences import (
    map_moderation_status,
    to_public,
    to_report,
    validate_blumenau_point,
)

router = APIRouter(prefix="/moderation", tags=["Moderação"])
Database = Annotated[Session, Depends(get_session)]
Moderator = Annotated[User, Depends(require_moderator)]

_OUTCOME_TITLES = {
    "approved": "Publicado",
    "revision": "Correção solicitada",
    "rejected": "Não aprovado",
}


def _list_moderators(session: Session) -> list[ModeratorRead]:
    primary = get_settings().principal_admin_email
    users = list(
        session.scalars(
            select(User)
            .where(User.role == "moderator", User.disabled_at.is_(None))
            .order_by(User.created_at.asc())
        )
    )
    items = [
        ModeratorRead(
            id=u.id,
            name=u.name,
            email=u.email,
            is_primary=bool(primary and u.email.lower() == primary),
            created_at=u.created_at,
        )
        for u in users
    ]
    items.sort(key=lambda item: (not item.is_primary, item.created_at))
    return items


def _list_active_occurrences(session: Session) -> list[OccurrenceRead]:
    rows = list(
        session.scalars(
            select(Occurrence)
            .where(
                Occurrence.moderation_status == "approved",
                Occurrence.published_at.is_not(None),
                Occurrence.status == "active",
            )
            .order_by(Occurrence.updated_at.desc())
            .limit(100)
        )
    )
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

    items = [
        to_public(
            row,
            confirmations_count=counts[row.id]["confirmed"],
            resolutions_count=counts[row.id]["resolved"],
        )
        for row in rows
    ]
    items.sort(key=lambda item: (-item.resolutions_count, -item.updated_at.timestamp()))
    return items


@router.get("/queue", response_model=ModerationQueueResponse)
def moderation_queue(_moderator: Moderator, session: Database):
    pending_reports = list(
        session.scalars(
            select(Occurrence)
            .where(Occurrence.moderation_status == "pending")
            .order_by(Occurrence.created_at.asc())
        )
    )
    complaints = list(
        session.scalars(
            select(OccurrenceComplaint).order_by(OccurrenceComplaint.created_at.desc())
        )
    )
    decisions = list(
        session.scalars(
            select(ModerationDecision).order_by(ModerationDecision.created_at.desc()).limit(100)
        )
    )
    return ModerationQueueResponse(
        pending_reports=[to_report(item) for item in pending_reports],
        pending_complaints=[
            ModerationComplaintRead(
                id=c.id,
                occurrence=to_public(c.occurrence),
                reason=c.reason,
                reviewed=c.reviewed,
                created_at=c.created_at,
            )
            for c in complaints
            if not c.reviewed
        ],
        reviewed_complaints=[
            ModerationComplaintRead(
                id=c.id,
                occurrence=to_public(c.occurrence),
                reason=c.reason,
                reviewed=c.reviewed,
                created_at=c.created_at,
            )
            for c in complaints
            if c.reviewed
        ],
        decisions=[
            ModerationDecisionRead(
                id=d.id,
                report=to_report(d.occurrence),
                status=map_moderation_status(d.status),
                reason=d.reason,
                created_at=d.created_at,
            )
            for d in decisions
            if d.status in ("approved", "revision", "rejected")
        ],
        active_occurrences=_list_active_occurrences(session),
        moderators=_list_moderators(session),
    )


@router.post("/occurrences/{occurrence_id}/review")
def review_occurrence(
    occurrence_id: UUID,
    payload: ModerationReviewRequest,
    moderator: Moderator,
    session: Database,
):
    occurrence = session.get(Occurrence, str(occurrence_id))
    if occurrence is None:
        raise HTTPException(status_code=404, detail="Relato não encontrado.")
    if occurrence.moderation_status != "pending":
        raise HTTPException(status_code=409, detail="Este relato já foi analisado.")

    db_status = "approved" if payload.decision == "published" else payload.decision
    now = utc_now()
    occurrence.moderation_status = db_status
    occurrence.moderation_reason = payload.reason
    occurrence.updated_at = now
    if db_status == "approved":
        occurrence.published_at = now
        occurrence.last_confirmed_at = now

    session.add(
        ModerationDecision(
            id=str(uuid4()),
            occurrence_id=occurrence.id,
            moderator_id=moderator.id,
            status=db_status,
            reason=payload.reason,
            created_at=now,
        )
    )

    if occurrence.user_id:
        prefs = session.get(UserPreference, occurrence.user_id)
        if prefs is None or prefs.alerts_enabled:
            place_label = occurrence.place_name or "Blumenau"
            session.add(
                Notification(
                    id=str(uuid4()),
                    user_id=occurrence.user_id,
                    title=_OUTCOME_TITLES[db_status],
                    body=f"{occurrence.occurrence_type.label} em {place_label}. {payload.reason}",
                    read=False,
                    created_at=now,
                )
            )

    session.commit()
    return {"status": "ok"}


@router.post("/occurrences/{occurrence_id}/resolution")
def decide_resolution(
    occurrence_id: UUID,
    payload: ResolutionDecisionRequest,
    _moderator: Moderator,
    session: Database,
):
    occurrence = session.get(Occurrence, str(occurrence_id))
    if (
        occurrence is None
        or occurrence.moderation_status != "approved"
        or occurrence.published_at is None
    ):
        raise HTTPException(status_code=404, detail="Ocorrência publicada não encontrada.")

    now = utc_now()
    if payload.decision == "resolve":
        occurrence.status = "resolved"
        occurrence.updated_at = now
        if occurrence.user_id:
            prefs = session.get(UserPreference, occurrence.user_id)
            if prefs is None or prefs.alerts_enabled:
                place_label = occurrence.place_name or "Blumenau"
                reason_suffix = f" {payload.reason.strip()}" if payload.reason and payload.reason.strip() else ""
                session.add(
                    Notification(
                        id=str(uuid4()),
                        user_id=occurrence.user_id,
                        title="Ocorrência marcada como resolvida",
                        body=f"{occurrence.occurrence_type.label} em {place_label} foi validada como resolvida.{reason_suffix}",
                        read=False,
                        created_at=now,
                    )
                )
    else:
        occurrence.status = "active"
        occurrence.updated_at = now
        session.execute(
            delete(OccurrenceContribution).where(
                OccurrenceContribution.occurrence_id == occurrence.id,
                OccurrenceContribution.kind == "resolved",
            )
        )

    session.commit()
    return {"status": occurrence.status}


@router.patch("/occurrences/{occurrence_id}/location", response_model=OccurrenceRead)
def update_occurrence_location(
    occurrence_id: UUID,
    payload: LocationUpdateRequest,
    _moderator: Moderator,
    session: Database,
):
    occurrence = session.get(Occurrence, str(occurrence_id))
    if occurrence is None:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    validate_blumenau_point(payload.latitude, payload.longitude)
    occurrence.latitude = payload.latitude
    occurrence.longitude = payload.longitude
    if payload.place_name is not None and payload.place_name.strip():
        occurrence.place_name = payload.place_name.strip()
    occurrence.updated_at = utc_now()
    session.commit()
    session.refresh(occurrence)
    return to_public(occurrence)


@router.post("/complaints/{complaint_id}/review")
def review_complaint(complaint_id: UUID, moderator: Moderator, session: Database):
    complaint = session.get(OccurrenceComplaint, str(complaint_id))
    if complaint is None:
        raise HTTPException(status_code=404, detail="Denúncia não encontrada.")
    complaint.reviewed = True
    complaint.reviewed_by = moderator.id
    complaint.reviewed_at = utc_now()
    session.commit()
    return {"status": "ok"}


@router.get("/moderators", response_model=list[ModeratorRead])
def list_moderators(_moderator: Moderator, session: Database):
    return _list_moderators(session)


@router.post("/moderators", response_model=ModeratorRead, status_code=201)
def add_moderator(payload: ModeratorAddRequest, _moderator: Moderator, session: Database):
    user = session.scalar(select(User).where(User.email == payload.email))
    if user is None or user.disabled_at is not None:
        raise HTTPException(
            status_code=404,
            detail="Nenhuma conta cadastrada com este e-mail. Peça para a pessoa criar a conta primeiro.",
        )
    if user.role == "moderator":
        raise HTTPException(status_code=409, detail="Esta conta já possui acesso de administrador.")
    user.role = "moderator"
    session.commit()
    primary = get_settings().principal_admin_email
    return ModeratorRead(
        id=user.id,
        name=user.name,
        email=user.email,
        is_primary=bool(primary and user.email.lower() == primary),
        created_at=user.created_at,
    )


@router.delete("/moderators/{user_id}", status_code=204)
def remove_moderator(user_id: UUID, moderator: Moderator, session: Database):
    user = session.get(User, str(user_id))
    if user is None or user.role != "moderator":
        raise HTTPException(status_code=404, detail="Administrador não encontrado.")
    primary = get_settings().principal_admin_email
    if primary and user.email.lower() == primary:
        raise HTTPException(
            status_code=403,
            detail="O administrador principal não pode ser removido.",
        )
    if user.id == moderator.id:
        raise HTTPException(
            status_code=400,
            detail="Você não pode remover o seu próprio acesso de administrador.",
        )
    user.role = "user"
    session.commit()
