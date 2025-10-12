from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    """Declarative base for SQLAlchemy models."""


settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
ScopedSession = scoped_session(SessionLocal)


def get_session() -> SessionLocal:
    """Return a thread-local session instance."""
    return ScopedSession()


def remove_session() -> None:
    """Remove current scoped session, for use with background tasks/tests."""
    ScopedSession.remove()


def get_db() -> Generator[SessionLocal, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Generator[SessionLocal, None, None]:
    """Provide a transactional scope for scripts or CLI tools."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:  # pragma: no cover - helper used in scripts
        session.rollback()
        raise
    finally:
        session.close()
