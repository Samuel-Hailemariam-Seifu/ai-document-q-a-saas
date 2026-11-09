from __future__ import annotations

import math
import os
import re
from collections.abc import Generator
from urllib.parse import urlparse, urlunparse

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

# Configure env BEFORE importing application modules.
_ADMIN_DB = "postgres"
_TEST_DB = "documind_test"
_DEFAULT_URL = f"postgresql+psycopg://postgres:postgres@localhost:5432/{_TEST_DB}"

os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", _DEFAULT_URL)
os.environ["OPENAI_API_KEY"] = ""
os.environ.setdefault("EMBEDDING_DIM", "384")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("KEYWORD_BACKEND", "postgres")


def _admin_url(db_url: str) -> str:
    parsed = urlparse(db_url.replace("postgresql+psycopg://", "postgresql://", 1))
    replaced = parsed._replace(path=f"/{_ADMIN_DB}")
    url = urlunparse(replaced)
    if db_url.startswith("postgresql+psycopg://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def _ensure_test_database(db_url: str) -> None:
    engine = create_engine(_admin_url(db_url), isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :n"),
                {"n": _TEST_DB},
            ).scalar()
            if exists:
                conn.execute(
                    text(
                        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                        "WHERE datname = :n AND pid <> pg_backend_pid()"
                    ),
                    {"n": _TEST_DB},
                )
                conn.execute(text(f'DROP DATABASE "{_TEST_DB}"'))
            conn.execute(text(f'CREATE DATABASE "{_TEST_DB}"'))
    finally:
        engine.dispose()


def _drop_test_database(db_url: str) -> None:
    engine = create_engine(_admin_url(db_url), isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as conn:
            conn.execute(
                text(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = :n AND pid <> pg_backend_pid()"
                ),
                {"n": _TEST_DB},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{_TEST_DB}"'))
    finally:
        engine.dispose()


def _run_migrations(db_url: str) -> None:
    cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", db_url)
    command.upgrade(cfg, "head")


def _hash_embed(texts: list[str], dim: int = 384) -> list[list[float]]:
    """Deterministic bag-of-words embedding into `dim` (no external API)."""
    out: list[list[float]] = []
    for text_value in texts:
        vec = [0.0] * dim
        for tok in re.findall(r"\w+", (text_value or "").lower()):
            idx = hash(tok) % dim
            vec[idx] += 1.0
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        out.append([x / norm for x in vec])
    return out


@pytest.fixture(scope="session")
def test_db_url() -> Generator[str, None, None]:
    url = os.environ["DATABASE_URL"]
    _ensure_test_database(url)
    _run_migrations(url)
    yield url
    _drop_test_database(url)


@pytest.fixture(scope="session")
def engine(test_db_url: str):
    from pgvector.psycopg import register_vector
    from sqlalchemy import event

    from app.core.pgvector_runtime import probe_pgvector, reset_pgvector_cache

    reset_pgvector_cache()
    eng = create_engine(test_db_url, pool_pre_ping=True)

    @event.listens_for(eng, "connect")
    def _register_vector(dbapi_connection, _connection_record) -> None:  # noqa: ANN001
        register_vector(dbapi_connection)

    probe_pgvector(eng)
    yield eng
    eng.dispose()
    reset_pgvector_cache()


@pytest.fixture
def db(engine) -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(bind=connection, autocommit=False, autoflush=False, class_=Session)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(autouse=True)
def _fake_embeddings(monkeypatch: pytest.MonkeyPatch):
    """Deterministic 384-d embeddings — never call external APIs in tests."""
    monkeypatch.setenv("OPENAI_API_KEY", "")
    from app.core import config as config_mod
    from app.services import embeddings_service as emb_mod
    from app.services import retrieval_service as ret_mod

    def _model() -> str:
        return "BAAI/bge-small-en-v1.5"

    monkeypatch.setattr(config_mod.settings, "openai_api_key", "")
    monkeypatch.setattr(config_mod.settings, "embedding_dim", 384)
    monkeypatch.setattr(emb_mod, "embed_texts", _hash_embed)
    monkeypatch.setattr(emb_mod, "configured_embedding_model", _model)
    monkeypatch.setattr(ret_mod, "configured_embedding_model", _model)
