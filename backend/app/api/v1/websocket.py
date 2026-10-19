from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
from app.services.notifications.notifier import ws_manager
from app.core.security import decode_access_token

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/notifications")
async def notifications_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time notification push.
    Authenticates via token query parameter.
    """
    user_id = "anonymous"
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]

    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            # Keep socket alive and respond to client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
    except Exception:
        ws_manager.disconnect(websocket, user_id)
