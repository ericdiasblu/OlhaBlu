from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_serializer


class OccurrenceTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    label: str
    icon: str


class OccurrenceRead(BaseModel):
    id: str
    occurrence_type: OccurrenceTypeRead
    description: str
    latitude: float
    longitude: float
    status: Literal["active", "resolved"]
    source: Literal["community", "official"]
    is_simulated: bool
    freshness: Literal["current", "expired"]
    created_at: datetime
    updated_at: datetime
    last_confirmed_at: datetime | None

    @field_serializer("created_at", "updated_at", "last_confirmed_at")
    def serialize_utc(self, value: datetime | None) -> str | None:
        return value.replace(tzinfo=UTC).isoformat() if value is not None else None


class OccurrencePage(BaseModel):
    items: list[OccurrenceRead]
    next_cursor: str | None
    has_more: bool
