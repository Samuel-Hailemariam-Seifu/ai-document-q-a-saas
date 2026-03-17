"""create subscriptions

Revision ID: 20260317_000006
Revises: 20260317_000005
Create Date: 2026-03-17

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260317_000006"
down_revision = "20260317_000005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="inactive"),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("workspace_id", name="uq_subscriptions_workspace_id"),
    )
    op.create_index(op.f("ix_subscriptions_workspace_id"), "subscriptions", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_subscriptions_stripe_customer_id"), "subscriptions", ["stripe_customer_id"], unique=False)
    op.create_index(op.f("ix_subscriptions_stripe_subscription_id"), "subscriptions", ["stripe_subscription_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_subscriptions_stripe_subscription_id"), table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_stripe_customer_id"), table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_workspace_id"), table_name="subscriptions")
    op.drop_table("subscriptions")

