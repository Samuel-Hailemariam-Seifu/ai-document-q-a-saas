"""Cached pgvector capability probes (version + column dimension)."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

_VECTOR_TYPE_RE = re.compile(r"vector\((\d+)\)", re.IGNORECASE)


@dataclass(frozen=True)
class PgVectorInfo:
    version: tuple[int, int, int]
    embedding_vec_dim: int | None
    supports_iterative_scan: bool


_cached: PgVectorInfo | None = None


def _parse_version(raw: str | None) -> tuple[int, int, int]:
    if not raw:
        return (0, 0, 0)
    parts = re.split(r"[^\d]+", raw.strip())
    nums = [int(p) for p in parts if p.isdigit()]
    while len(nums) < 3:
        nums.append(0)
    return (nums[0], nums[1], nums[2])


def probe_pgvector(engine: Engine) -> PgVectorInfo:
    """Query once and cache pgvector version + document_chunks.embedding_vec dimension."""
    global _cached
    if _cached is not None:
        return _cached

    with engine.connect() as conn:
        ext = conn.execute(
            text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
        ).scalar_one_or_none()
        version = _parse_version(ext)

        dim: int | None = None
        type_name = conn.execute(
            text(
                """
                SELECT format_type(a.atttypid, a.atttypmod)
                FROM pg_attribute a
                JOIN pg_class c ON c.oid = a.attrelid
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = 'document_chunks'
                  AND a.attname = 'embedding_vec'
                  AND a.attnum > 0
                  AND NOT a.attisdropped
                LIMIT 1
                """
            )
        ).scalar_one_or_none()
        if type_name:
            m = _VECTOR_TYPE_RE.search(str(type_name))
            if m:
                dim = int(m.group(1))

    info = PgVectorInfo(
        version=version,
        embedding_vec_dim=dim,
        supports_iterative_scan=version >= (0, 8, 0),
    )
    _cached = info
    logger.info(
        "pgvector %s.%s.%s (iterative_scan=%s, embedding_vec_dim=%s)",
        version[0],
        version[1],
        version[2],
        info.supports_iterative_scan,
        dim,
    )
    return info


def get_pgvector_info() -> PgVectorInfo | None:
    return _cached


def reset_pgvector_cache() -> None:
    """Test helper."""
    global _cached
    _cached = None
