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

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.backend_cors_origins.split(",") if o.strip()]


settings = Settings()

