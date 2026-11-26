import base64
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException

from app.core.config import get_settings
from app.models import Occurrence
from app.schemas.occurrence import OccurrenceRead, OccurrenceTypeRead, ReportOutcome, ReportRead

ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024

# Limite geográfico aproximado de Blumenau (compatível com o frontend)
BLUMENAU_BOUNDS = (-49.26, -27.06, -48.94, -26.64)


def current_cutoff() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None) - timedelta(
        hours=get_settings().occurrence_ttl_hours
    )


def validate_blumenau_point(latitude: float, longitude: float) -> None:
    west, south, east, north = BLUMENAU_BOUNDS
    if not (west <= longitude <= east and south <= latitude <= north):
        raise HTTPException(
            status_code=422,
            detail="O ponto informado fica fora de Blumenau. Escolha um local dentro do município.",
        )


def decode_photo(
    photo_base64: str | None, photo_content_type: str | None
) -> tuple[bytes | None, str | None]:
    if not photo_base64:
        return None, None
    content_type = (photo_content_type or "").strip().lower()
    if content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=422,
            detail="Formato de foto inválido. Envie JPEG, PNG ou WebP.",
        )
    raw_b64 = photo_base64.split(",", 1)[-1].strip()
    try:
        data = base64.b64decode(raw_b64, validate=True)
    except Exception:
        raise HTTPException(status_code=422, detail="Arquivo de foto inválido.")
    if len(data) == 0 or len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=422, detail="A foto deve ter no máximo 5 MB.")
    return data, content_type


def map_moderation_status(db_status: str) -> ReportOutcome:
    if db_status == "approved":
        return "published"
    if db_status in ("pending", "revision", "rejected"):
        return db_status
    return "rejected"


def to_public(
    occurrence: Occurrence,
    *,
    confirmations_count: int = 0,
    resolutions_count: int = 0,
    viewer_confirmed: bool = False,
    viewer_resolved: bool = False,
    viewer_complained: bool = False,
) -> OccurrenceRead:
    # Uma resposta pública nunca serializa o autor, e-mail ou dados de moderação.
    return OccurrenceRead(
        id=occurrence.id,
        occurrence_type=OccurrenceTypeRead.model_validate(occurrence.occurrence_type),
        description=occurrence.description,
        place_name=occurrence.place_name,
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
        has_photo=bool(occurrence.photo_content_type),
        confirmations_count=confirmations_count,
        resolutions_count=resolutions_count,
        viewer_confirmed=viewer_confirmed,
        viewer_resolved=viewer_resolved,
        viewer_complained=viewer_complained,
        created_at=occurrence.created_at,
        updated_at=occurrence.updated_at,
        last_confirmed_at=occurrence.last_confirmed_at,
    )


def to_report(occurrence: Occurrence) -> ReportRead:
    return ReportRead(
        id=occurrence.id,
        occurrence_type=OccurrenceTypeRead.model_validate(occurrence.occurrence_type),
        description=occurrence.description,
        place_name=occurrence.place_name or f"{occurrence.latitude:.4f}, {occurrence.longitude:.4f}",
        latitude=occurrence.latitude,
        longitude=occurrence.longitude,
        status=map_moderation_status(occurrence.moderation_status),
        reason=occurrence.moderation_reason,
        has_photo=bool(occurrence.photo_content_type),
        created_at=occurrence.created_at,
        updated_at=occurrence.updated_at,
    )
