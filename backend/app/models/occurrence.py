from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Double, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('user', 'moderator')", name="role"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime)
    disabled_at: Mapped[datetime | None] = mapped_column(DateTime)


class OccurrenceType(Base):
    __tablename__ = "occurrence_types"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True)
    label: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(40))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class Occurrence(Base):
    __tablename__ = "occurrences"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'resolved')", name="status"),
        CheckConstraint(
            "moderation_status IN ('pending', 'approved', 'rejected', 'hidden')",
            name="moderation_status",
        ),
        CheckConstraint("source IN ('community', 'official')", name="source"),
        CheckConstraint("latitude BETWEEN -90 AND 90", name="latitude"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="longitude"),
        Index("ix_occurrences_publication", "moderation_status", "status", "last_confirmed_at"),
        Index("ix_occurrences_location", "latitude", "longitude"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    type_id: Mapped[int] = mapped_column(ForeignKey("occurrence_types.id"))
    description: Mapped[str] = mapped_column(Text)
    latitude: Mapped[float] = mapped_column(Double)
    longitude: Mapped[float] = mapped_column(Double)
    status: Mapped[str] = mapped_column(String(20), default="active")
    moderation_status: Mapped[str] = mapped_column(String(20), default="pending")
    source: Mapped[str] = mapped_column(String(20), default="community")
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False)
    source_reference: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime)
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime)
    occurrence_type: Mapped[OccurrenceType] = relationship(lazy="joined")
