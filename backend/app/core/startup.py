"""Process startup validation for embeddings + pgvector schema."""

from __future__ import annotations

import logging
import os

from sqlalchemy.engine import Engine

from app.core.config import settings
from app.core.pgvector_runtime import probe_pgvector
from app.services.embeddings_service import EmbeddingConfigError, validate_embedding_config

logger = logging.getLogger(__name__)


def run_startup_checks(engine: Engine) -> None:
    # On Vercel Hobby, FastEmbed is omitted from the bundle — OpenAI embeddings are required.
    if os.environ.get("VERCEL") and not settings.openai_api_key:
        logger.error(
            "OPENAI_API_KEY is required on Vercel (FastEmbed exceeds Hobby function size). "
            "Add OPENAI_API_KEY and set EMBEDDING_DIM=1536 to match text-embedding-3-small "
            "(and migrate/re-embed if the column is still vector(384))."
        )

    validate_embedding_config()

    info = probe_pgvector(engine)
    if info.embedding_vec_dim is None:
        logger.warning(
            "document_chunks.embedding_vec not found — run alembic upgrade head before serving traffic"
        )
        return

    if info.embedding_vec_dim != settings.embedding_dim:
        raise EmbeddingConfigError(
            f"Postgres column document_chunks.embedding_vec is vector({info.embedding_vec_dim}) "
            f"but EMBEDDING_DIM={settings.embedding_dim}. They must match. "
            f"Re-migrate / re-embed after changing dimensions."
        )

    if info.version == (0, 0, 0):
        raise EmbeddingConfigError(
            "pgvector extension is not installed. Enable it (CREATE EXTENSION vector) "
            "or, on Supabase, turn on the vector extension in the dashboard."
        )
