from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/documind"

    @property
    def database_url_normalized(self) -> str:
        """Use psycopg (v3) driver when plain postgresql:// is set."""
        url = self.database_url
        if url.startswith("postgresql://") and "+" not in url.split("//")[0]:
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

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

