from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import SessionLocal, get_db
from app.models.user import User
from app.schemas.billing import CheckoutSessionOut, PortalSessionOut, SubscriptionOut
from app.services.stripe_service import (
    create_billing_portal_session,
    create_checkout_session,
    get_or_create_subscription_row,
    upsert_from_subscription_event,
)
from app.services.workspace_service import get_workspace

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/workspaces/{workspace_id}", response_model=SubscriptionOut)
def get_subscription(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionOut:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    sub = get_or_create_subscription_row(db, workspace_id=workspace_id)
    return SubscriptionOut(
        workspace_id=sub.workspace_id,
        status=sub.status,
        current_period_end=sub.current_period_end,
        cancel_at_period_end=sub.cancel_at_period_end,
    )


@router.post("/workspaces/{workspace_id}/checkout", response_model=CheckoutSessionOut)
def checkout(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CheckoutSessionOut:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    try:
        url = create_checkout_session(db, workspace_id=workspace_id, customer_email=current_user.email)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return CheckoutSessionOut(url=url)


@router.post("/workspaces/{workspace_id}/portal", response_model=PortalSessionOut)
def portal(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PortalSessionOut:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    try:
        url = create_billing_portal_session(db, workspace_id=workspace_id)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return PortalSessionOut(url=url)


@router.post("/webhook")
async def webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
) -> dict:
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=500, detail="STRIPE_WEBHOOK_SECRET is not set")
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    payload = await request.body()

    import stripe  # local import to avoid loading if unused

    stripe.api_key = settings.stripe_secret_key
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.stripe_webhook_secret)
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event.get("type")
    data_object = (event.get("data") or {}).get("object") or {}

    # Only handle subscription lifecycle for MVP
    if event_type in {"customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"}:
        db: Session = SessionLocal()
        try:
            upsert_from_subscription_event(db, stripe_sub=data_object)
        finally:
            db.close()

    return {"received": True}

