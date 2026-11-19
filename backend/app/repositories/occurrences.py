from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Occurrence, OccurrenceType


def list_types(session: Session) -> list[OccurrenceType]:
    return list(
        session.scalars(
            select(OccurrenceType)
            .where(OccurrenceType.enabled.is_(True))
            .order_by(OccurrenceType.id)
        )
    )


def list_public(
    session: Session,
    *,
    bbox: tuple[float, float, float, float],
    status: str,
    freshness: str,
    cutoff: datetime,
    type_id: int | None,
    cursor: str | None,
    limit: int,
) -> list[Occurrence]:
    west, south, east, north = bbox
    query = select(Occurrence).where(
        Occurrence.moderation_status == "approved",
        Occurrence.published_at.is_not(None),
        Occurrence.status == status,
        Occurrence.latitude.between(south, north),
        Occurrence.longitude.between(west, east),
    )
    if freshness == "current":
        query = query.where(Occurrence.last_confirmed_at >= cutoff)
    elif freshness == "expired":
        query = query.where(
            (Occurrence.last_confirmed_at < cutoff) | Occurrence.last_confirmed_at.is_(None)
        )
    if type_id is not None:
        query = query.where(Occurrence.type_id == type_id)
    if cursor is not None:
        query = query.where(Occurrence.id > cursor)
    return list(session.scalars(query.order_by(Occurrence.id).limit(limit + 1)))


def get_public(session: Session, occurrence_id: str) -> Occurrence | None:
    return session.scalar(
        select(Occurrence).where(
            Occurrence.id == occurrence_id,
            Occurrence.moderation_status == "approved",
            Occurrence.published_at.is_not(None),
        )
    )
