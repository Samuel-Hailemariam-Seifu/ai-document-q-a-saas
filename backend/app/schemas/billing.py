from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class SubscriptionOut(BaseModel):
    workspace_id: int
    status: str
    current_period_end: datetime | None
    cancel_at_period_end: bool


class CheckoutSessionOut(BaseModel):
    url: str


class PortalSessionOut(BaseModel):
    url: str

