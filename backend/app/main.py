from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Vercel may load this as backend.app.main — put backend/ on sys.path for `import app.*`.
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError, SQLAlchemyError

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
    # On Vercel, don't hard-crash the whole function if DB/embeddings aren't ready yet —
    # /health still answers so deploy + env debugging stays possible.
    try:
        run_startup_checks(engine)
    except Exception:
        logger.exception("Startup checks failed (API will start; DB-backed routes may error)")
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="DocuMind AI API", lifespan=lifespan)

    cors_kw: dict = {
        "allow_origins": settings.cors_origins_list,
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }
    # Preview + production Vercel frontends
    if settings.cors_origin_regex:
        cors_kw["allow_origin_regex"] = settings.cors_origin_regex

    app.add_middleware(CORSMiddleware, **cors_kw)

    app.include_router(auth_router)
    app.include_router(workspaces_router)
    app.include_router(documents_router)
    app.include_router(chat_router)
    app.include_router(billing_router)

    @app.exception_handler(OperationalError)
    async def db_operational_error(_request: Request, exc: OperationalError):
        logger.exception("Database connection failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content={
                "detail": (
                    "Database unavailable. Check DATABASE_URL on Vercel — "
                    "URL-encode password special characters (@→%40, $→%24, !→%21)."
                )
            },
        )

    @app.exception_handler(SQLAlchemyError)
    async def db_error(_request: Request, exc: SQLAlchemyError):
        logger.exception("Database error: %s", exc)
        return JSONResponse(status_code=503, content={"detail": "Database error"})

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
