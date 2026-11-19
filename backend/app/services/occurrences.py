from datetime import UTC, datetime, timedelta

from app.core.config import get_settings
from app.models import Occurrence
from app.schemas.occurrence import OccurrenceRead, OccurrenceTypeRead


def current_cutoff() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None) - timedelta(
        hours=get_settings().occurrence_ttl_hours
    )


def to_public(occurrence: Occurrence) -> OccurrenceRead:
    # Uma resposta pública nunca serializa o autor, e-mail ou dados de moderação.
    return OccurrenceRead(
        id=occurrence.id,
        occurrence_type=OccurrenceTypeRead.model_validate(occurrence.occurrence_type),
        description=occurrence.description,
        latitude=occurrence.latitude,
        longitude=occurrence.longitude,
        status=occurrence.status,
        source=occurrence.source,
        is_simulated=occurrence.is_simulated,
        freshness=(
            "current"
            if occurrence.last_confirmed_at is not None
            and occurrence.last_confirmed_at >= current_cutoff()
            else "expired"
        ),
        created_at=occurrence.created_at,
        updated_at=occurrence.updated_at,
        last_confirmed_at=occurrence.last_confirmed_at,
    )
