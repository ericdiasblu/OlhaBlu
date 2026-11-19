from fastapi import APIRouter

from app.api.routes import occurrences, system

router = APIRouter(prefix="/api")
router.include_router(system.router)
router.include_router(occurrences.router)
