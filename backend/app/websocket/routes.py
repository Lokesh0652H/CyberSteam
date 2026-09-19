from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await manager.connect_events(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_events(websocket)

@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect_alerts(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_alerts(websocket)
