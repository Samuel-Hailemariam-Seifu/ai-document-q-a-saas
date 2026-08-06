from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict

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
    storage_path: str = "uploads"
    redis_url: str = "redis://localhost:6379/0"
    run_ingest_inline: bool = False  # if True, run document ingestion in-process (no Redis/Celery needed)
    openai_api_key: str = ""
    groq_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_dim: int = 1536
    local_embedding_model: str = "BAAI/bge-small-en-v1.5"
    llm_model: str = "llama-3.1-8b-instant"  # Groq default; OpenAI uses its own model string
    chunk_size: int = 2000
    chunk_overlap: int = 250
    retrieval_top_k: int = 12
    retrieval_neighbor_window: int = 1

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
        return [o.strip() for o in self.backend_cors_origins.split(",") if o.strip()]


settings = Settings()

