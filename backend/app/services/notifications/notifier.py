import json
from typing import Optional, Dict, Set
from fastapi import WebSocket
from sqlalchemy.orm import Session
from app.models.models import Notification

class ConnectionManager:
    """Manages active WebSockets for real-time notification delivery."""
    def __init__(self):
        # Maps user_id -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            dead_sockets = set()
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead_sockets.add(ws)
            for dead in dead_sockets:
                self.active_connections[user_id].discard(dead)

    async def broadcast(self, message: dict):
        for user_id, sockets in list(self.active_connections.items()):
            dead_sockets = set()
            for ws in sockets:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead_sockets.add(ws)
            for dead in dead_sockets:
                sockets.discard(dead)

ws_manager = ConnectionManager()

def create_notification(
    db: Session,
    recipient_user_id: str,
    title: str,
    message: str,
    notification_type: str = "STATUS_CHANGE",
    complaint_id: Optional[str] = None
) -> Notification:
    """
    Persists an in-app notification to the database.
    """
    notif = Notification(
        recipient_user_id=recipient_user_id,
        complaint_id=complaint_id,
        notification_type=notification_type,
        title=title,
        message=message,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
