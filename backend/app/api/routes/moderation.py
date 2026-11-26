from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import require_moderator, utc_now
from app.db.session import get_session
from app.models import (
    ModerationDecision,
    Notification,
    Occurrence,
    OccurrenceComplaint,
    User,
    UserPreference,
)
from app.schemas.occurrence import (
    ModerationComplaintRead,
    ModerationDecisionRead,
    ModerationQueueResponse,
    ModerationReviewRequest,
)
from app.services.occurrences import map_moderation_status, to_public, to_report

router = APIRouter(prefix="/moderation", tags=["Moderação"])
Database = Annotated[Session, Depends(get_session)]
Moderator = Annotated[User, Depends(require_moderator)]

_OUTCOME_TITLES = {
    "approved": "Publicado",
    "revision": "Correção solicitada",
    "rejected": "Não aprovado",
}


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
