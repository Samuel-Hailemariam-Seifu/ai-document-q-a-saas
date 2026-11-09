from __future__ import annotations

import os

from pydantic_settings import BaseSettings, SettingsConfigDict


def _on_vercel() -> bool:
    return bool(os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"))

# Prisma/Supabase URL params that libpq/psycopg do not accept.
_NON_LIBPQ_QUERY_KEYS = frozenset({"pgbouncer", "schema"})


def _normalize_postgres_url(url: str) -> str:
    """Prefer psycopg v3 and drop non-libpq query params (e.g. pgbouncer=true)."""
    if url.startswith("postgresql://") and "+" not in url.split("//", 1)[0]:
        url = "postgresql+psycopg://" + url.removeprefix("postgresql://")

    if "?" not in url:
        return url

    base, query = url.split("?", 1)
    fragment = ""
    if "#" in query:
        query, fragment = query.split("#", 1)
        fragment = "#" + fragment

    kept: list[str] = []
    for part in query.split("&"):
        if not part:
            continue
        key = part.split("=", 1)[0].lower()
        if key in _NON_LIBPQ_QUERY_KEYS:
            continue
        kept.append(part)

    if not kept:
        return base + fragment
    return f"{base}?{'&'.join(kept)}{fragment}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/documind"
    # Session-mode / direct Postgres URL for Alembic (Supabase port 5432). Falls back to database_url.
    direct_url: str | None = None

    @property
    def database_url_normalized(self) -> str:
        return _normalize_postgres_url(self.database_url)

    @property
    def alembic_database_url(self) -> str:
        """URL for migrations: prefer DIRECT_URL when set (required for PgBouncer/Supabase)."""
        return _normalize_postgres_url(self.direct_url or self.database_url)

    jwt_secret: str = "change_me"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 14
    backend_cors_origins: str = "http://localhost:5173"
    # On Vercel the filesystem is ephemeral — default to /tmp and ingest inline (no Celery).
    storage_path: str = "/tmp/documind-uploads" if _on_vercel() else "uploads"
    redis_url: str = "redis://localhost:6379/0"
    run_ingest_inline: bool = True if _on_vercel() else False
    openai_api_key: str = ""
    groq_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"
    # Kept for docs/compat; Groq accounts often lack embedding model access — prefer FastEmbed.
    groq_embedding_model: str = "nomic-embed-text-v1.5"
    embedding_dim: int = 384
    local_embedding_model: str = "BAAI/bge-small-en-v1.5"
    llm_model: str = "openai/gpt-oss-20b"  # Groq default (llama-3.1-8b-instant retired); OpenAI uses its own
    chunk_size: int = 2000
    chunk_overlap: int = 250
    retrieval_top_k: int = 12
    retrieval_neighbor_window: int = 1
    # Hybrid retrieval: top-N candidates per channel before RRF fusion.
    # Effective N = max(50, retrieval_top_k) unless this is set higher via property helper.
    keyword_backend: str = "postgres"  # postgres | bm25
    hnsw_ef_search: int = 100
    hnsw_overfetch_factor: int = 4

    # billing (Stripe)
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_pro_monthly: str = ""
    stripe_success_url: str = "http://localhost:5173/app/billing?status=success"
    stripe_cancel_url: str = "http://localhost:5173/app/billing?status=cancel"

    # email (Resend) + auth flows
    frontend_base_url: str = "http://localhost:5173"
    resend_api_key: str = ""
    email_from: str = "DocuMind <onboarding@resend.dev>"
    require_email_verification: bool = False
    verify_token_expire_hours: int = 24
    reset_token_expire_minutes: int = 30

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [o.strip().rstrip("/") for o in self.backend_cors_origins.split(",") if o.strip()]
        fe = (self.frontend_base_url or "").strip().rstrip("/")
        if fe and fe not in origins:
            origins.append(fe)
        # Always allow the production frontend alias used on Vercel
        for extra in (
            "https://documind-ai-chi-weld.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ):
            if extra not in origins:
                origins.append(extra)
        return origins

    @property
    def cors_origin_regex(self) -> str | None:
        # Allow any *.vercel.app preview/production frontend when deployed on Vercel
        if _on_vercel():
            return r"https://.*\.vercel\.app"
        return None

    @property
    def retrieval_candidate_n(self) -> int:
        return max(50, int(self.retrieval_top_k))


settings = Settings()
