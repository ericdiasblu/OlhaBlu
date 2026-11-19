from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.repositories import occurrences as repository
from app.schemas.occurrence import OccurrencePage, OccurrenceRead, OccurrenceTypeRead
from app.services.occurrences import current_cutoff, to_public

router = APIRouter(tags=["Consulta pública"])
Database = Annotated[Session, Depends(get_session)]


def parse_bbox(value: str) -> tuple[float, float, float, float]:
    try:
        west, south, east, north = [float(part) for part in value.split(",")]
        if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=422, detail="bbox deve ser oeste,sul,leste,norte válidos.")
    return west, south, east, north


@router.get("/occurrence-types", response_model=list[OccurrenceTypeRead])
def occurrence_types(session: Database):
    return repository.list_types(session)


@router.get("/occurrences", response_model=OccurrencePage)
def occurrences(
    session: Database,
    bbox: str = "-49.15,-27.00,-48.98,-26.82",
    status: Literal["active", "resolved"] = "active",
    freshness: Literal["current", "expired", "all"] = "current",
    type_id: Annotated[int | None, Query(ge=1)] = None,
    cursor: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    rows = repository.list_public(
        session,
        bbox=parse_bbox(bbox),
        status=status,
        freshness=freshness,
        cutoff=current_cutoff(),
        type_id=type_id,
        cursor=str(cursor) if cursor else None,
        limit=limit,
    )
    has_more = len(rows) > limit
    rows = rows[:limit]
    return OccurrencePage(
        items=[to_public(row) for row in rows],
        next_cursor=rows[-1].id if has_more else None,
        has_more=has_more,
    )


@router.get("/occurrences/{occurrence_id}", response_model=OccurrenceRead)
def occurrence_detail(occurrence_id: UUID, session: Database):
    occurrence = repository.get_public(session, str(occurrence_id))
    if occurrence is None:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    return to_public(occurrence)
