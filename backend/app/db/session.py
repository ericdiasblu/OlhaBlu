from collections.abc import Generator
from functools import lru_cache

from fastapi import HTTPException
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    if not settings.database_configured:
        raise HTTPException(status_code=503, detail="Consulta temporariamente indisponível.")
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        connect_args={
            "connect_timeout": settings.db_connect_timeout_seconds,
            "read_timeout": 5,
            "write_timeout": 5,
            "init_command": "SET time_zone = '+00:00'",
        },
    )


def get_session() -> Generator[Session]:
    with Session(get_engine()) as session:
        yield session
