"""Process startup validation for embeddings + pgvector schema."""

from __future__ import annotations

import logging

from sqlalchemy.engine import Engine

from app.core.config import settings
from app.core.pgvector_runtime import probe_pgvector
from app.services.embeddings_service import EmbeddingConfigError, validate_embedding_config

logger = logging.getLogger(__name__)


def run_startup_checks(engine: Engine) -> None:
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
