"""
Database setup and connection manager for RealValue API.
Supports Railway PostgreSQL (or any standard PostgreSQL database via DATABASE_URL).
If DATABASE_URL is not set or unreachable, gracefully allows the API to operate in demo/local mode.
Automatically creates all required tables on startup if connected to PostgreSQL.
"""

from __future__ import annotations

import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from ..config import settings

logger = logging.getLogger("realvalue.db")


class Base(DeclarativeBase):
    pass


def get_async_database_url() -> str | None:
    raw_url = settings.database_url.strip() if hasattr(settings, "database_url") and settings.database_url else ""
    if not raw_url:
        return None
    # Ensure asyncpg driver is used for async SQLAlchemy
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
        return raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return raw_url


engine = None
AsyncSessionLocal = None

db_url = get_async_database_url()
if db_url:
    try:
        engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
        logger.info("Configured PostgreSQL async engine")
    except Exception as exc:
        logger.warning("Could not initialize PostgreSQL engine: %s", exc)


async def init_db() -> bool:
    """
    Called on FastAPI startup.
    If a database URL is configured, creates all tables automatically.
    Never blocks or throws exceptions so the server always becomes healthy.
    """
    global engine, AsyncSessionLocal
    if not engine:
        db_url = get_async_database_url()
        if not db_url:
            logger.info("No DATABASE_URL configured; skipping DB init.")
            return False
        try:
            engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
            AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
        except Exception as exc:
            logger.warning("Could not initialize PostgreSQL engine: %s", exc)
            return False

    try:
        from . import models  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Successfully checked/created all PostgreSQL tables.")
        return True
    except Exception as exc:
        logger.warning("Auto-creation of PostgreSQL tables skipped: %s", exc)
        return False


async def get_db() -> AsyncGenerator[AsyncSession | None, None]:
    if not AsyncSessionLocal:
        yield None
        return
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
