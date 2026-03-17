from __future__ import annotations

import sys

from celery import Celery

from app.core.config import settings

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
# On Windows the default prefork pool causes PermissionError with billiard semaphores; use solo.
if sys.platform == "win32":
    celery_app.conf.worker_pool = "solo"

# Ensure tasks are always registered (containers + autodiscovery can be finicky)
celery_app.conf.imports = ("app.tasks.document_tasks",)
celery_app.autodiscover_tasks(["app.tasks"])

