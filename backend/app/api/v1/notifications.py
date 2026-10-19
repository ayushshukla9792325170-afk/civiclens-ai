from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.models.models import Notification, User
from app.schemas.schemas import NotificationResponse
from app.core.permissions import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_my_notifications(
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieves all notifications for the authenticated user."""
    notifs = db.query(Notification).filter(
        Notification.recipient_user_id == user.id
    ).order_by(desc(Notification.created_at)).limit(50).all()
    return [NotificationResponse.model_validate(n) for n in notifs]

@router.get("/unread-count")
def get_unread_count(
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Returns number of unread notifications."""
    count = db.query(Notification).filter(
        Notification.recipient_user_id == user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.put("/{id}/read")
def mark_as_read(
    id: str,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Marks a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.recipient_user_id == user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    notif.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Notification marked as read."}

@router.put("/read-all")
def mark_all_as_read(
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Marks all unread notifications for the user as read."""
    now = datetime.now(timezone.utc)
    db.query(Notification).filter(
        Notification.recipient_user_id == user.id,
        Notification.is_read == False
    ).update({"is_read": True, "read_at": now})
    db.commit()
    return {"message": "All notifications marked as read."}
