from fastapi import APIRouter

from app.api.routes import alerts, auth, moderation, occurrences, system

router = APIRouter(prefix="/api")
router.include_router(system.router)
router.include_router(auth.router)
router.include_router(occurrences.router)
router.include_router(moderation.router)
router.include_router(alerts.router)
