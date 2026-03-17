from __future__ import annotations

import httpx

from app.core.config import settings


async def send_email(*, to_email: str, subject: str, html: str) -> None:
    """
    Sends email using Resend if RESEND_API_KEY is configured.
    If not configured, this is a no-op (dev-friendly).
    """
    if not settings.resend_api_key:
        return

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from,
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
        )
        res.raise_for_status()

