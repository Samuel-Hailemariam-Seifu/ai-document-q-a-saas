"""add document processing timestamps

Revision ID: 20260318_000008
Revises: 20260317_000007
Create Date: 2026-03-18

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260318_000008"
down_revision = "20260317_000007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("processing_started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("documents", sa.Column("processing_finished_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "processing_finished_at")
    op.drop_column("documents", "processing_started_at")

