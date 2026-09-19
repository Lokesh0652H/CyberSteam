import os
import shutil

base_dir = r"C:\Users\Lokush\.gemini\antigravity\scratch\cyberstream\backend"

ws_dir = os.path.join(base_dir, "app", "websocket")
os.makedirs(ws_dir, exist_ok=True)

files = {
    "app/websocket/manager.py": """from fastapi import WebSocket
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
""",

    "app/websocket/consumer.py": """import asyncio
import json
import os
from kafka import KafkaConsumer
from app.websocket.manager import manager

class KafkaWebSocketBridge:
    def __init__(self):
        self.running = False
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

    async def start(self):
        self.running = True
        asyncio.create_task(self.consume_events())
        asyncio.create_task(self.consume_alerts())

    def stop(self):
        self.running = False

    async def consume_events(self):
        while self.running:
            try:
                consumer = KafkaConsumer(
                    'cyber-events',
                    bootstrap_servers=self.bootstrap_servers,
                    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                    auto_offset_reset='latest',
                    consumer_timeout_ms=1000
                )
                
                for message in consumer:
                    if not self.running:
                        break
                    await manager.broadcast_event(message.value)
                    
            except Exception as e:
                print(f"Error consuming events from Kafka: {e}")
                await asyncio.sleep(5)

    async def consume_alerts(self):
        while self.running:
            try:
                consumer = KafkaConsumer(
                    'security-alerts',
                    bootstrap_servers=self.bootstrap_servers,
                    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                    auto_offset_reset='latest',
                    consumer_timeout_ms=1000
                )
                
                for message in consumer:
                    if not self.running:
                        break
                    await manager.broadcast_alert(message.value)
                    
            except Exception as e:
                print(f"Error consuming alerts from Kafka: {e}")
                await asyncio.sleep(5)

bridge = KafkaWebSocketBridge()
""",

    "app/websocket/routes.py": """from fastapi import APIRouter, WebSocket, WebSocketDisconnect
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
""",

    "app/main.py": """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, SessionLocal
from app.db.models import User
from app.db.seed import seed_db
from app.websocket.consumer import bridge

from app.api import auth, dashboard, events, alerts, analytics, ips, servers, rules, system, generator, audit, reports
from app.websocket import routes as ws_routes
import contextlib

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        if not db.query(User).first():
            seed_db()
    finally:
        db.close()
        
    await bridge.start()
    
    yield
    
    # Shutdown
    bridge.stop()

app = FastAPI(title="CyberStream API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(ips.router)
app.include_router(servers.router)
app.include_router(rules.router)
app.include_router(system.router)
app.include_router(generator.router)
app.include_router(audit.router)
app.include_router(reports.router)
app.include_router(ws_routes.router)

@app.get("/")
def root():
    return {"message": "CyberStream API is running"}
"""
}

for name, content in files.items():
    with open(os.path.join(base_dir, name), 'w') as f:
        f.write(content)

print("Generated websocket and main.py")
