from __future__ import annotations

from collections.abc import Generator

from pgvector.psycopg import register_vector
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url_normalized, pool_pre_ping=True)


@event.listens_for(engine, "connect")
def _register_vector(dbapi_connection, _connection_record) -> None:  # noqa: ANN001
    # Extension may be missing until migrations run; adapters register once it exists.
    try:
        register_vector(dbapi_connection)
    except Exception:  # noqa: BLE001
        pass


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
