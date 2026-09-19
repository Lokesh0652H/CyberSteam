from fastapi import WebSocket
from typing import List, Dict
import json

class ConnectionManager:
    def __init__(self):
        self.event_connections: List[WebSocket] = []
        self.alert_connections: List[WebSocket] = []

    async def connect_events(self, websocket: WebSocket):
        await websocket.accept()
        self.event_connections.append(websocket)

    def disconnect_events(self, websocket: WebSocket):
        if websocket in self.event_connections:
            self.event_connections.remove(websocket)

    async def connect_alerts(self, websocket: WebSocket):
        await websocket.accept()
        self.alert_connections.append(websocket)

    def disconnect_alerts(self, websocket: WebSocket):
        if websocket in self.alert_connections:
            self.alert_connections.remove(websocket)

    async def broadcast_event(self, message: dict):
        dead_connections = []
        for connection in self.event_connections:
            try:
                await connection.send_json(message)
            except:
                dead_connections.append(connection)
        
        for dead in dead_connections:
            self.disconnect_events(dead)

    async def broadcast_alert(self, message: dict):
        dead_connections = []
        for connection in self.alert_connections:
            try:
                await connection.send_json(message)
            except:
                dead_connections.append(connection)
                
        for dead in dead_connections:
            self.disconnect_alerts(dead)

manager = ConnectionManager()
