from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.router import router
from app.api.routes.health import router as health_router
from app.core.config import get_settings
from app.db.session import get_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    if get_engine.cache_info().currsize:
        get_engine().dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    development = settings.app_env == "development"
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/api/docs" if development else None,
        redoc_url=None,
        openapi_url="/api/openapi.json" if development else None,
        lifespan=lifespan,
    )
    app.include_router(router)
    app.include_router(health_router)

    @app.exception_handler(SQLAlchemyError)
    async def database_error(request: Request, exc: SQLAlchemyError):
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Consulta temporariamente indisponível. Tente novamente em instantes."
            },
        )

    return app


app = create_app()
