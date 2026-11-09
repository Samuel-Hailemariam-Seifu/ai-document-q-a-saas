from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.billing import router as billing_router
from app.api.routes.chat import router as chat_router
from app.api.routes.documents import router as documents_router
from app.api.routes.workspaces import router as workspaces_router
from app.core.config import settings
from app.core.database import engine
from app.core.startup import run_startup_checks

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        run_startup_checks(engine)
    except Exception:
        logger.exception("Startup checks failed")
        raise
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="DocuMind AI API", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router)
    app.include_router(workspaces_router)
    app.include_router(documents_router)
    app.include_router(chat_router)
    app.include_router(billing_router)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
