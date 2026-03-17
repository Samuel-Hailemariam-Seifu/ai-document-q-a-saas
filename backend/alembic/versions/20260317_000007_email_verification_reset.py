"""email verification + password reset

Revision ID: 20260317_000007
Revises: 20260317_000006
Create Date: 2026-03-17

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260317_000007"
down_revision = "20260317_000006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")))

    op.create_table(
        "auth_tokens",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("token_type", sa.String(length=30), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("token_hash", name="uq_auth_tokens_token_hash"),
    )
    op.create_index(op.f("ix_auth_tokens_user_id"), "auth_tokens", ["user_id"], unique=False)
    op.create_index(op.f("ix_auth_tokens_token_hash"), "auth_tokens", ["token_hash"], unique=False)
    op.create_index(op.f("ix_auth_tokens_token_type"), "auth_tokens", ["token_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_auth_tokens_token_type"), table_name="auth_tokens")
    op.drop_index(op.f("ix_auth_tokens_token_hash"), table_name="auth_tokens")
    op.drop_index(op.f("ix_auth_tokens_user_id"), table_name="auth_tokens")
    op.drop_table("auth_tokens")
    op.drop_column("users", "email_verified")

