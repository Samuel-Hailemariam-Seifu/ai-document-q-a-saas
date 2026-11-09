from __future__ import annotations

import sys

try:
    from celery import Celery
except ImportError:  # pragma: no cover - optional on Vercel slim installs
    Celery = None  # type: ignore[misc, assignment]

from app.core.config import settings

if Celery is None:
    celery_app = None
else:
    celery_app = Celery(
        "documind",
        broker=settings.redis_url,
        backend=settings.redis_url,
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )

    # Windows: prefer solo pool (avoids billiard PermissionError with the default prefork pool).
    if sys.platform.startswith("win"):
        celery_app.conf.worker_pool = "solo"

    celery_app.conf.imports = ("app.tasks.document_tasks",)
    celery_app.autodiscover_tasks(["app.tasks"])
