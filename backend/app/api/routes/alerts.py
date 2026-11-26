from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.security import get_current_user, utc_now
from app.db.session import get_session
from app.models import Notification, User, UserPreference
from app.schemas.occurrence import AlertsResponse, NotificationRead, PreferencesUpdateRequest

router = APIRouter(prefix="/me", tags=["Alertas e preferências"])
Database = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _get_or_create_prefs(session: Session, user_id: str) -> UserPreference:
    prefs = session.get(UserPreference, user_id)
    if prefs is None:
        prefs = UserPreference(
            user_id=user_id,
            alerts_enabled=True,
            push_enabled=False,
            updated_at=utc_now(),
        )
        session.add(prefs)
        session.flush()
    return prefs


@router.get("/alerts", response_model=AlertsResponse)
def list_alerts(user: CurrentUser, session: Database):
    prefs = _get_or_create_prefs(session, user.id)
    items = list(
        session.scalars(
            select(Notification)
            .where(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc())
            .limit(100)
        )
    )
    session.commit()
    return AlertsResponse(
        items=[
            NotificationRead(
                id=n.id,
                title=n.title,
                body=n.body,
                read=n.read,
                created_at=n.created_at,
            )
            for n in items
        ],
        alerts_enabled=prefs.alerts_enabled,
        push_enabled=prefs.push_enabled,
    )


@router.post("/alerts/{notification_id}/read")
def mark_alert_read(notification_id: UUID, user: CurrentUser, session: Database):
    notice = session.get(Notification, str(notification_id))
    if notice is None or notice.user_id != user.id:
        raise HTTPException(status_code=404, detail="Alerta não encontrado.")
    notice.read = True
    session.commit()
    return {"status": "ok"}


@router.post("/alerts/read-all")
def mark_all_alerts_read(user: CurrentUser, session: Database):
    session.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read.is_(False))
        .values(read=True)
    )
    session.commit()
    return {"status": "ok"}


@router.patch("/preferences")
def update_preferences(
    payload: PreferencesUpdateRequest, user: CurrentUser, session: Database
):
    prefs = _get_or_create_prefs(session, user.id)
    if payload.alerts_enabled is not None:
        prefs.alerts_enabled = payload.alerts_enabled
    if payload.push_enabled is not None:
        prefs.push_enabled = payload.push_enabled
    prefs.updated_at = utc_now()
    session.commit()
    return {
        "alerts_enabled": prefs.alerts_enabled,
        "push_enabled": prefs.push_enabled,
    }
