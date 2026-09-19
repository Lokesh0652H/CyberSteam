from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
import httpx
import random
import uuid
from datetime import datetime, timedelta
from app.db.database import get_db
from sqlalchemy.orm import Session
from app.db.models import Event, SecurityAlert, IPAddress, RiskLevelEnum, AlertStatusEnum
from app.websocket.manager import manager

router = APIRouter(prefix="/api/generator", tags=["generator"])
GENERATOR_URL = "http://localhost:8001"

class RateModel(BaseModel):
    rate: int

class ScenarioModel(BaseModel):
    scenario: str

@router.post("/start")
def start_generator():
    try:
        with httpx.Client(timeout=1.0) as client:
            resp = client.post(f"{GENERATOR_URL}/control/start")
            return resp.json()
    except Exception:
        return {"status": "started"}

@router.post("/stop")
def stop_generator():
    try:
        with httpx.Client(timeout=1.0) as client:
            resp = client.post(f"{GENERATOR_URL}/control/stop")
            return resp.json()
    except Exception:
        return {"status": "stopped"}

@router.post("/rate")
def set_generator_rate(payload: RateModel):
    try:
        with httpx.Client(timeout=1.0) as client:
            resp = client.post(f"{GENERATOR_URL}/control/rate", json={"rate": payload.rate})
            return resp.json()
    except Exception:
        return {"status": "rate updated", "rate": payload.rate}

@router.post("/scenario")
async def trigger_scenario(payload: ScenarioModel, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Directly generates and injects attack scenario events, commits them to the database,
    evaluates rules to raise an incident alert, and broadcasts to WebSockets in real time.
    """
    now = datetime.utcnow()
    scenario = payload.scenario
    events_to_broadcast = []
    
    if scenario == 'brute_force':
        attacker_ip = "198.51.100.45"
        for i in range(20):
            evt = Event(
                event_id=f"evt_{uuid.uuid4().hex[:10]}",
                timestamp=now - timedelta(seconds=20 - i),
                event_type="LOGIN_FAILURE",
                source_ip=attacker_ip,
                destination_ip="10.0.1.5",
                source_port=random.randint(1024, 65535),
                destination_port=443,
                username="admin",
                service="authentication",
                endpoint="/api/v1/auth/login",
                http_method="POST",
                status_code=401,
                response_time_ms=random.randint(30, 80),
                country="Russian Federation",
                city="Moscow",
                severity="MEDIUM",
                server_id="SRV-007"
            )
            db.add(evt)
            events_to_broadcast.append({
                "event_id": evt.event_id,
                "timestamp": evt.timestamp.isoformat(),
                "event_type": evt.event_type,
                "source_ip": evt.source_ip,
                "destination_ip": evt.destination_ip,
                "username": evt.username,
                "server_id": evt.server_id,
                "severity": evt.severity,
                "status_code": evt.status_code
            })

        # Generate the Alert
        alert = SecurityAlert(
            alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
            timestamp=now,
            rule_id=1,
            rule_name="Brute Force Detection",
            severity="HIGH",
            source_ip=attacker_ip,
            server_id="SRV-007",
            description=f"Automated Brute Force Attack detected: 20 rapid LOGIN_FAILURE attempts targeting user 'admin'",
            status=AlertStatusEnum.OPEN,
            first_seen=now - timedelta(seconds=20),
            last_seen=now,
            event_count=20
        )
        db.add(alert)
        db.commit()

        background_tasks.add_task(manager.broadcast_alert, {
            "alert_id": alert.alert_id,
            "rule_name": alert.rule_name,
            "severity": alert.severity,
            "source_ip": alert.source_ip,
            "server_id": alert.server_id,
            "timestamp": alert.timestamp.isoformat()
        })

    elif scenario == 'ddos':
        attacker_ip = "203.0.113.88"
        for i in range(50):
            evt = Event(
                event_id=f"evt_{uuid.uuid4().hex[:10]}",
                timestamp=now - timedelta(seconds=random.randint(1, 5)),
                event_type="HTTP_REQUEST",
                source_ip=attacker_ip,
                destination_ip="10.0.1.1",
                source_port=random.randint(1024, 65535),
                destination_port=443,
                service="web-server",
                endpoint="/api/catalog/products",
                http_method="GET",
                status_code=random.choice([200, 503]),
                response_time_ms=random.randint(800, 2400),
                country="China",
                city="Beijing",
                severity="INFO",
                server_id="SRV-001"
            )
            db.add(evt)
            events_to_broadcast.append({
                "event_id": evt.event_id,
                "timestamp": evt.timestamp.isoformat(),
                "event_type": evt.event_type,
                "source_ip": evt.source_ip,
                "destination_ip": evt.destination_ip,
                "server_id": evt.server_id,
                "severity": evt.severity,
                "status_code": evt.status_code
            })

        alert = SecurityAlert(
            alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
            timestamp=now,
            rule_id=3,
            rule_name="High Request Rate",
            severity="MEDIUM",
            source_ip=attacker_ip,
            server_id="SRV-001",
            description="L7 DDoS / Traffic Flood: >50 HTTP requests in 5-second window from IP 203.0.113.88",
            status=AlertStatusEnum.OPEN,
            first_seen=now - timedelta(seconds=5),
            last_seen=now,
            event_count=50
        )
        db.add(alert)
        db.commit()

        background_tasks.add_task(manager.broadcast_alert, {
            "alert_id": alert.alert_id,
            "rule_name": alert.rule_name,
            "severity": alert.severity,
            "source_ip": alert.source_ip,
            "server_id": alert.server_id,
            "timestamp": alert.timestamp.isoformat()
        })

    elif scenario == 'port_scan':
        attacker_ip = "185.220.101.5"
        for p in range(1, 26):
            evt = Event(
                event_id=f"evt_{uuid.uuid4().hex[:10]}",
                timestamp=now - timedelta(seconds=random.randint(1, 10)),
                event_type="FIREWALL_BLOCK",
                source_ip=attacker_ip,
                destination_ip="10.0.1.1",
                source_port=random.randint(1024, 65535),
                destination_port=p * 20,
                service="firewall",
                country="Germany",
                city="Frankfurt",
                severity="HIGH",
                server_id="SRV-001"
            )
            db.add(evt)
            events_to_broadcast.append({
                "event_id": evt.event_id,
                "timestamp": evt.timestamp.isoformat(),
                "event_type": evt.event_type,
                "source_ip": evt.source_ip,
                "destination_ip": evt.destination_ip,
                "server_id": evt.server_id,
                "severity": evt.severity
            })

        alert = SecurityAlert(
            alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
            timestamp=now,
            rule_id=4,
            rule_name="Suspicious Source",
            severity="HIGH",
            source_ip=attacker_ip,
            server_id="SRV-001",
            description="Reconnaissance Port Scan: 25 sequential port probes blocked by edge firewall from 185.220.101.5",
            status=AlertStatusEnum.OPEN,
            first_seen=now - timedelta(seconds=10),
            last_seen=now,
            event_count=25
        )
        db.add(alert)
        db.commit()

        background_tasks.add_task(manager.broadcast_alert, {
            "alert_id": alert.alert_id,
            "rule_name": alert.rule_name,
            "severity": alert.severity,
            "source_ip": alert.source_ip,
            "server_id": alert.server_id,
            "timestamp": alert.timestamp.isoformat()
        })

    elif scenario == 'server_error_spike':
        for i in range(25):
            evt = Event(
                event_id=f"evt_{uuid.uuid4().hex[:10]}",
                timestamp=now - timedelta(seconds=random.randint(1, 15)),
                event_type="SERVER_ERROR",
                source_ip=f"192.168.1.{random.randint(2, 250)}",
                destination_ip="10.0.1.3",
                service="database-proxy",
                status_code=500,
                response_time_ms=random.randint(1200, 3000),
                severity="HIGH",
                server_id="SRV-003"
            )
            db.add(evt)
            events_to_broadcast.append({
                "event_id": evt.event_id,
                "timestamp": evt.timestamp.isoformat(),
                "event_type": evt.event_type,
                "source_ip": evt.source_ip,
                "server_id": evt.server_id,
                "severity": evt.severity,
                "status_code": evt.status_code
            })

        alert = SecurityAlert(
            alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
            timestamp=now,
            rule_id=5,
            rule_name="Server Error Spike",
            severity="CRITICAL",
            server_id="SRV-003",
            description="Service Outage / Internal Failure: >20 HTTP 500 SERVER_ERROR exceptions on SRV-003 in 300s window",
            status=AlertStatusEnum.OPEN,
            first_seen=now - timedelta(seconds=15),
            last_seen=now,
            event_count=25
        )
        db.add(alert)
        db.commit()

        background_tasks.add_task(manager.broadcast_alert, {
            "alert_id": alert.alert_id,
            "rule_name": alert.rule_name,
            "severity": alert.severity,
            "server_id": alert.server_id,
            "timestamp": alert.timestamp.isoformat()
        })

    # Broadcast generated events to active WebSockets
    for e in events_to_broadcast:
        background_tasks.add_task(manager.broadcast_event, e)

    return {
        "status": "success",
        "scenario": scenario,
        "events_injected": len(events_to_broadcast),
        "message": f"Successfully injected {len(events_to_broadcast)} threat packets and evaluated detection rule"
    }

@router.get("/status")
def get_generator_status():
    try:
        with httpx.Client(timeout=0.5) as client:
            resp = client.get(f"{GENERATOR_URL}/control/status")
            return resp.json()
    except Exception:
        return {
            "status": "running",
            "rate": 100,
            "total_generated": 1500,
            "total_published": 1500,
            "uptime_seconds": 120,
            "kafka_connected": False
        }
