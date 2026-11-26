"""Fluxo completo: sessões, relatos com foto, contribuições, denúncias, moderação e alertas."""

import sqlalchemy as sa
from sqlalchemy.dialects.mysql import MEDIUMBLOB

from alembic import op

revision = "0002_full_workflow"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    options = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    op.add_column("occurrences", sa.Column("place_name", sa.String(120)))
    op.add_column("occurrences", sa.Column("moderation_reason", sa.String(300)))
    op.add_column(
        "occurrences",
        sa.Column("photo_data", sa.LargeBinary().with_variant(MEDIUMBLOB, "mysql")),
    )
    op.add_column("occurrences", sa.Column("photo_content_type", sa.String(40)))

    op.execute("ALTER TABLE occurrences DROP CHECK ck_occurrences_moderation_status")
    op.execute(
        "ALTER TABLE occurrences ADD CONSTRAINT ck_occurrences_moderation_status "
        "CHECK (moderation_status IN ('pending', 'approved', 'revision', 'rejected', 'hidden'))"
    )

    op.create_table(
        "user_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime()),
        sa.UniqueConstraint("token_hash", name="uq_user_sessions_token_hash"),
        **options,
    )
    op.create_index("ix_user_sessions_user_revoked", "user_sessions", ["user_id", "revoked_at"])

    op.create_table(
        "user_preferences",
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("alerts_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("push_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        **options,
    )

    op.create_table(
        "occurrence_contributions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "occurrence_id",
            sa.String(36),
            sa.ForeignKey("occurrences.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "kind IN ('confirmed', 'resolved')", name="ck_occurrence_contributions_kind"
        ),
        sa.UniqueConstraint("occurrence_id", "user_id", "kind", name="uq_occurrence_contrib_unique"),
        **options,
    )

    op.create_table(
        "occurrence_complaints",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "occurrence_id",
            sa.String(36),
            sa.ForeignKey("occurrences.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("reason", sa.String(300), nullable=False),
        sa.Column("reviewed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("reviewed_by", sa.String(36), sa.ForeignKey("users.id")),
        sa.Column("reviewed_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("occurrence_id", "user_id", name="uq_occurrence_complaint_unique"),
        **options,
    )

    op.create_table(
        "moderation_decisions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "occurrence_id",
            sa.String(36),
            sa.ForeignKey("occurrences.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("moderator_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("reason", sa.String(300), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "status IN ('approved', 'revision', 'rejected', 'hidden')",
            name="ck_moderation_decisions_status",
        ),
        **options,
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("body", sa.String(500), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        **options,
    )
    op.create_index("ix_notifications_user_read", "notifications", ["user_id", "read", "created_at"])


def downgrade():
    op.drop_table("notifications")
    op.drop_table("moderation_decisions")
    op.drop_table("occurrence_complaints")
    op.drop_table("occurrence_contributions")
    op.drop_table("user_preferences")
    op.drop_table("user_sessions")

    op.execute("ALTER TABLE occurrences DROP CHECK ck_occurrences_moderation_status")
    op.execute(
        "ALTER TABLE occurrences ADD CONSTRAINT ck_occurrences_moderation_status "
        "CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden'))"
    )
    op.drop_column("occurrences", "photo_content_type")
    op.drop_column("occurrences", "photo_data")
    op.drop_column("occurrences", "moderation_reason")
    op.drop_column("occurrences", "place_name")
