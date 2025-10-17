"""Add admin flag to users and update privacy defaults.

Revision ID: 0003_add_user_admin_and_privacy_defaults
Revises: 0002_add_password_reset_tokens
Create Date: 2025-10-17
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0003_add_user_admin_and_privacy_defaults"
down_revision = "0002_add_password_reset_tokens"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column(
        "users",
        "is_admin",
        server_default=None,
    )
    op.alter_column(
        "user_preferences",
        "privacy_level",
        server_default="private",
        existing_type=sa.String(length=32),
    )
    op.execute(
        sa.text(
            "UPDATE user_preferences SET privacy_level = 'private' WHERE privacy_level IS NULL"
        )
    )


def downgrade() -> None:
    op.alter_column(
        "user_preferences",
        "privacy_level",
        server_default="community",
        existing_type=sa.String(length=32),
    )
    op.drop_column("users", "is_admin")
