from fastapi import APIRouter

router = APIRouter(tags=["Sistema"])


@router.get("/info")
def app_info() -> dict:
    return {
        "name": "AEX | Ocorrências urbanas",
        "version": "0.1.0",
        "city": "Blumenau",
        "timezone": "America/Sao_Paulo",
        "map_center": [-49.0661, -26.9194],
        "features": {"public_read": True, "write": False, "push": False, "photos": False},
    }
