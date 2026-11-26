from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator


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
    place_name: str | None = None
    latitude: float
    longitude: float
    status: Literal["active", "resolved"]
    source: Literal["community", "official"]
    is_simulated: bool
    freshness: Literal["current", "expired"]
    has_photo: bool = False
    confirmations_count: int = 0
    resolutions_count: int = 0
    viewer_confirmed: bool = False
    viewer_resolved: bool = False
    viewer_complained: bool = False
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


class OccurrenceCreateRequest(BaseModel):
    type_id: int = Field(ge=1)
    description: str = Field(min_length=12, max_length=500)
    place_name: str = Field(min_length=1, max_length=120)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    photo_base64: str | None = None
    photo_content_type: str | None = None

    @field_validator("description", "place_name")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Campo obrigatório.")
        return cleaned


class OccurrenceUpdateRequest(OccurrenceCreateRequest):
    remove_photo: bool = False


ReportOutcome = Literal["pending", "published", "revision", "rejected"]


class ReportRead(BaseModel):
    id: str
    occurrence_type: OccurrenceTypeRead
    description: str
    place_name: str
    latitude: float
    longitude: float
    status: ReportOutcome
    reason: str | None = None
    has_photo: bool = False
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_utc(self, value: datetime) -> str:
        return value.replace(tzinfo=UTC).isoformat()


class ContributionRequest(BaseModel):
    kind: Literal["confirmed", "resolved"]


class ContributionResponse(BaseModel):
    status: Literal["active", "resolved"]
    confirmations_count: int
    resolutions_count: int
    viewer_confirmed: bool
    viewer_resolved: bool


class ComplaintRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=300)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Informe o motivo da denúncia.")
        return cleaned


class ModerationReviewRequest(BaseModel):
    decision: Literal["published", "revision", "rejected"]
    reason: str = Field(min_length=1, max_length=300)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Informe o motivo da decisão.")
        return cleaned


class ModerationComplaintRead(BaseModel):
    id: str
    occurrence: OccurrenceRead
    reason: str
    reviewed: bool
    created_at: datetime

    @field_serializer("created_at")
    def serialize_utc(self, value: datetime) -> str:
        return value.replace(tzinfo=UTC).isoformat()


class ModerationDecisionRead(BaseModel):
    id: str
    report: ReportRead
    status: Literal["published", "revision", "rejected"]
    reason: str
    created_at: datetime

    @field_serializer("created_at")
    def serialize_utc(self, value: datetime) -> str:
        return value.replace(tzinfo=UTC).isoformat()


class ModerationQueueResponse(BaseModel):
    pending_reports: list[ReportRead]
    pending_complaints: list[ModerationComplaintRead]
    decisions: list[ModerationDecisionRead]
    reviewed_complaints: list[ModerationComplaintRead]


class NotificationRead(BaseModel):
    id: str
    title: str
    body: str
    read: bool
    created_at: datetime

    @field_serializer("created_at")
    def serialize_utc(self, value: datetime) -> str:
        return value.replace(tzinfo=UTC).isoformat()


class AlertsResponse(BaseModel):
    items: list[NotificationRead]
    alerts_enabled: bool
    push_enabled: bool


class PreferencesUpdateRequest(BaseModel):
    alerts_enabled: bool | None = None
    push_enabled: bool | None = None
