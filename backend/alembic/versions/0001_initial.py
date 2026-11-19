"""Estrutura inicial e catálogo de tipos; não insere ocorrências reais ou simuladas."""

import sqlalchemy as sa

from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    options = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("disabled_at", sa.DateTime()),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.CheckConstraint("role IN ('user', 'moderator')", name=op.f("ck_users_role")),
        **options,
    )
    types = op.create_table(
        "occurrence_types",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("slug", sa.String(50), nullable=False),
        sa.Column("label", sa.String(80), nullable=False),
        sa.Column("icon", sa.String(40), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.UniqueConstraint("slug", name="uq_occurrence_types_slug"),
        **options,
    )
    op.create_table(
        "occurrences",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id")),
        sa.Column("type_id", sa.Integer(), sa.ForeignKey("occurrence_types.id"), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("latitude", sa.Double(), nullable=False),
        sa.Column("longitude", sa.Double(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("moderation_status", sa.String(20), nullable=False),
        sa.Column("source", sa.String(20), nullable=False),
        sa.Column("is_simulated", sa.Boolean(), nullable=False),
        sa.Column("source_reference", sa.String(500)),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("published_at", sa.DateTime()),
        sa.Column("last_confirmed_at", sa.DateTime()),
        sa.CheckConstraint("status IN ('active', 'resolved')", name=op.f("ck_occurrences_status")),
        sa.CheckConstraint(
            "moderation_status IN ('pending', 'approved', 'rejected', 'hidden')",
            name=op.f("ck_occurrences_moderation_status"),
        ),
        sa.CheckConstraint(
            "source IN ('community', 'official')", name=op.f("ck_occurrences_source")
        ),
        sa.CheckConstraint("latitude BETWEEN -90 AND 90", name=op.f("ck_occurrences_latitude")),
        sa.CheckConstraint("longitude BETWEEN -180 AND 180", name=op.f("ck_occurrences_longitude")),
        **options,
    )
    op.create_index(
        "ix_occurrences_publication",
        "occurrences",
        ["moderation_status", "status", "last_confirmed_at"],
    )
    op.create_index("ix_occurrences_location", "occurrences", ["latitude", "longitude"])
    op.bulk_insert(
        types,
        [
            {
                "id": 1,
                "slug": "alagamento",
                "label": "Alagamento",
                "icon": "waves",
                "enabled": True,
            },
            {"id": 2, "slug": "acidente", "label": "Acidente", "icon": "car", "enabled": True},
            {
                "id": 3,
                "slug": "arvore-caida",
                "label": "Árvore caída",
                "icon": "tree",
                "enabled": True,
            },
            {"id": 4, "slug": "incendio", "label": "Incêndio", "icon": "flame", "enabled": True},
            {
                "id": 5,
                "slug": "deslizamento",
                "label": "Deslizamento",
                "icon": "mountain",
                "enabled": True,
            },
            {
                "id": 6,
                "slug": "via-danificada",
                "label": "Via danificada",
                "icon": "road",
                "enabled": True,
            },
            {
                "id": 7,
                "slug": "falta-de-energia",
                "label": "Falta de energia",
                "icon": "zap",
                "enabled": True,
            },
        ],
    )


def downgrade():
    op.drop_table("occurrences")
    op.drop_table("occurrence_types")
    op.drop_table("users")
