from __future__ import annotations

from datetime import datetime, timezone

import stripe
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.subscription import Subscription


def _ensure_stripe_configured() -> None:
    if not settings.stripe_secret_key:
        raise RuntimeError("STRIPE_SECRET_KEY is not set")
    stripe.api_key = settings.stripe_secret_key


def get_or_create_subscription_row(db: Session, *, workspace_id: int) -> Subscription:
    sub = db.execute(select(Subscription).where(Subscription.workspace_id == workspace_id)).scalar_one_or_none()
    if sub:
        return sub
    sub = Subscription(workspace_id=workspace_id, status="inactive", cancel_at_period_end=False)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def create_checkout_session(db: Session, *, workspace_id: int, customer_email: str) -> str:
    _ensure_stripe_configured()
    if not settings.stripe_price_pro_monthly:
        raise RuntimeError("STRIPE_PRICE_PRO_MONTHLY is not set")

    sub_row = get_or_create_subscription_row(db, workspace_id=workspace_id)

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=sub_row.stripe_customer_id or None,
        customer_email=None if sub_row.stripe_customer_id else customer_email,
        line_items=[{"price": settings.stripe_price_pro_monthly, "quantity": 1}],
        success_url=settings.stripe_success_url,
        cancel_url=settings.stripe_cancel_url,
        allow_promotion_codes=True,
        subscription_data={
            "metadata": {"workspace_id": str(workspace_id)},
        },
        metadata={"workspace_id": str(workspace_id)},
    )

    # Persist customer id if created during checkout
    if session.get("customer") and not sub_row.stripe_customer_id:
        sub_row.stripe_customer_id = str(session["customer"])
        db.commit()

    return str(session.url)


def create_billing_portal_session(db: Session, *, workspace_id: int) -> str:
    _ensure_stripe_configured()
    sub_row = get_or_create_subscription_row(db, workspace_id=workspace_id)
    if not sub_row.stripe_customer_id:
        raise RuntimeError("No Stripe customer for this workspace yet")
    ps = stripe.billing_portal.Session.create(
        customer=sub_row.stripe_customer_id,
        return_url=settings.stripe_cancel_url,
    )
    return str(ps.url)


def upsert_from_subscription_event(db: Session, *, stripe_sub: dict) -> None:
    """
    stripe_sub is a Stripe subscription object dict from webhook.
    Requires metadata.workspace_id to be set.
    """
    meta = (stripe_sub.get("metadata") or {}) if isinstance(stripe_sub, dict) else {}
    ws_id_raw = meta.get("workspace_id")
    if not ws_id_raw:
        return
    try:
        workspace_id = int(ws_id_raw)
    except ValueError:
        return

    sub_row = get_or_create_subscription_row(db, workspace_id=workspace_id)
    sub_row.stripe_customer_id = str(stripe_sub.get("customer") or sub_row.stripe_customer_id or "")
    sub_row.stripe_subscription_id = str(stripe_sub.get("id") or sub_row.stripe_subscription_id or "")
    sub_row.status = str(stripe_sub.get("status") or "inactive")
    sub_row.cancel_at_period_end = bool(stripe_sub.get("cancel_at_period_end") or False)

    cpe = stripe_sub.get("current_period_end")
    if isinstance(cpe, (int, float)):
        sub_row.current_period_end = datetime.fromtimestamp(cpe, tz=timezone.utc)
    db.commit()

