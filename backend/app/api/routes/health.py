from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import BACKEND_ROOT, get_settings
from app.db.session import get_engine

router = APIRouter(tags=["Saúde"])


@router.get("/health/live")
def liveness() -> dict:
    return {"status": "ok"}


@router.get("/health/ready")
def readiness() -> dict:
    if not get_settings().database_configured:
        raise HTTPException(status_code=503, detail="Banco não configurado.")
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
            revisions = set(connection.scalars(text("SELECT version_num FROM alembic_version")))
            from alembic.config import Config
            from alembic.script import ScriptDirectory

            expected = set(
                ScriptDirectory.from_config(Config(str(BACKEND_ROOT / "alembic.ini"))).get_heads()
            )
            if revisions != expected:
                raise HTTPException(status_code=503, detail="Migrações pendentes.")
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Banco indisponível ou migrações pendentes.")
    return {"status": "ready", "database": "ok", "migrations": "ok"}
