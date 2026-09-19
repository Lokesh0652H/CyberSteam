from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import event_service
from app.schemas.events import PaginatedEvents, EventStats, EventTimeline
from app.db.models import Event, SecurityAlert, SecurityRule, IPAddress, RiskLevelEnum, AlertStatusEnum
from app.websocket.manager import manager
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("", response_model=PaginatedEvents)
def get_events(
    event_type: Optional[str] = None,
    source_ip: Optional[str] = None,
    username: Optional[str] = None,
    server_id: Optional[str] = None,
    severity: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    filters = {k: v for k, v in locals().items() if v is not None and k not in ['page', 'page_size', 'db']}
    return event_service.get_events(db, filters, page, page_size)

@router.get("/recent")
def get_recent_events(limit: int = 50, db: Session = Depends(get_db)):
    return event_service.get_recent_events(db, limit)

@router.get("/stats", response_model=EventStats)
def get_event_stats(window: str = '1h', db: Session = Depends(get_db)):
    return event_service.get_event_stats(db, window)

@router.get("/timeline", response_model=EventTimeline)
def get_event_timeline(hours: int = 24, db: Session = Depends(get_db)):
    return event_service.get_event_timeline(db, hours)

# Known geographic coordinates for realistic map visualization
GEO_COORDINATES = {
    "New York": (40.7128, -74.0060, "US"),
    "San Francisco": (37.7749, -122.4194, "US"),
    "Chicago": (41.8781, -87.6298, "US"),
    "Dallas": (32.7767, -96.7970, "US"),
    "Mumbai": (19.0760, 72.8777, "IN"),
    "Delhi": (28.6139, 77.2090, "IN"),
    "Bangalore": (12.9716, 77.5946, "IN"),
    "Chennai": (13.0827, 80.2707, "IN"),
    "London": (51.5074, -0.1278, "GB"),
    "Manchester": (53.4808, -2.2426, "GB"),
    "Berlin": (52.5200, 13.4050, "DE"),
    "Frankfurt": (50.1109, 8.6821, "DE"),
    "Munich": (48.1351, 11.5820, "DE"),
    "Tokyo": (35.6762, 139.6503, "JP"),
    "Osaka": (34.6937, 135.5023, "JP"),
    "Seoul": (37.5665, 126.9780, "KR"),
    "Beijing": (39.9042, 116.4074, "CN"),
    "Shanghai": (31.2304, 121.4737, "CN"),
    "Moscow": (55.7558, 37.6173, "RU"),
    "St Petersburg": (59.9343, 30.3351, "RU"),
    "Sydney": (-33.8688, 151.2093, "AU"),
    "Melbourne": (-37.8136, 144.9631, "AU"),
    "Sao Paulo": (-23.5505, -46.6333, "BR"),
    "Rio de Janeiro": (-22.9068, -43.1729, "BR"),
}

@router.post("/ingest")
async def ingest_events(events: List[Dict[str, Any]], background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Ingests generated events, persists them to DB, updates IP geolocation analytics,
    evaluates rule-based detection engine, and broadcasts over WebSockets.
    """
    if not events:
        return {"ingested": 0}

    now = datetime.utcnow()
    db_events = []
    
    for raw in events:
        ts = raw.get("timestamp")
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                ts = now
        elif not ts:
            ts = now

        evt = Event(
            event_id=raw.get("event_id") or f"evt_{uuid.uuid4().hex[:10]}",
            timestamp=ts,
            event_type=raw.get("event_type", "HTTP_REQUEST"),
            source_ip=raw.get("source_ip", "127.0.0.1"),
            destination_ip=raw.get("destination_ip"),
            source_port=raw.get("source_port"),
            destination_port=raw.get("destination_port"),
            username=raw.get("username"),
            service=raw.get("service"),
            endpoint=raw.get("endpoint"),
            http_method=raw.get("http_method"),
            status_code=raw.get("status_code"),
            response_time_ms=raw.get("response_time_ms"),
            country=raw.get("country"),
            city=raw.get("city"),
            severity=raw.get("severity", "INFO"),
            server_id=raw.get("server_id"),
            metadata_=raw.get("metadata")
        )
        db_events.append(evt)

    # Batch insert events
    db.bulk_save_objects(db_events)
    db.commit()

    # Update IP geolocation & statistics in batch
    for raw in events[:20]:  # sample top events per batch for efficiency
        src_ip = raw.get("source_ip")
        if not src_ip:
            continue
            
        city = raw.get("city")
        country = raw.get("country")
        is_blocked = raw.get("event_type") in ["FIREWALL_BLOCK", "DNS_BLOCK", "ACCESS_DENIED"]
        is_failed = raw.get("event_type") == "LOGIN_FAILURE"
        
        coords = GEO_COORDINATES.get(city)
        lat = coords[0] if coords else 20.0
        lng = coords[1] if coords else 0.0

        ip_record = db.query(IPAddress).filter(IPAddress.ip_address == src_ip).first()
        if not ip_record:
            ip_record = IPAddress(
                ip_address=src_ip,
                country=country or (coords[2] if coords else "US"),
                city=city or "Unknown",
                latitude=lat,
                longitude=lng,
                total_events=1,
                failed_events=1 if is_failed else 0,
                blocked_events=1 if is_blocked else 0,
                first_seen=now,
                last_seen=now,
                risk_level=RiskLevelEnum.HIGH if is_blocked else RiskLevelEnum.LOW
            )
            db.add(ip_record)
        else:
            ip_record.total_events = (ip_record.total_events or 0) + 1
            if is_failed:
                ip_record.failed_events = (ip_record.failed_events or 0) + 1
            if is_blocked:
                ip_record.blocked_events = (ip_record.blocked_events or 0) + 1
            ip_record.last_seen = now
            if ip_record.blocked_events > 10:
                ip_record.risk_level = RiskLevelEnum.CRITICAL
            elif ip_record.blocked_events > 3:
                ip_record.risk_level = RiskLevelEnum.HIGH
    
    # Evaluate rules against recent window
    time_window = now - timedelta(minutes=5)
    recent_failures = db.query(Event.source_ip, func.count(Event.id))\
        .filter(Event.timestamp >= time_window, Event.event_type == "LOGIN_FAILURE")\
        .group_by(Event.source_ip).having(func.count(Event.id) >= 10).all()
        
    for ip, count in recent_failures:
        existing = db.query(SecurityAlert).filter(
            SecurityAlert.source_ip == ip,
            SecurityAlert.rule_name == "Brute Force Detection",
            SecurityAlert.status == AlertStatusEnum.OPEN
        ).first()
        if not existing:
            alert = SecurityAlert(
                alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
                timestamp=now,
                rule_id=1,
                rule_name="Brute Force Detection",
                severity="HIGH",
                source_ip=ip,
                description=f"Over {count} failed login attempts from IP {ip} in 5-min window",
                status=AlertStatusEnum.OPEN,
                first_seen=time_window,
                last_seen=now,
                event_count=count
            )
            db.add(alert)
            db.commit()
            background_tasks.add_task(manager.broadcast_alert, {
                "alert_id": alert.alert_id,
                "rule_name": alert.rule_name,
                "severity": alert.severity,
                "source_ip": alert.source_ip,
                "timestamp": alert.timestamp.isoformat()
            })

    db.commit()

    # Broadcast recent event to connected WebSockets
    if events:
        latest = events[-1]
        background_tasks.add_task(manager.broadcast_event, latest)

    return {"ingested": len(events)}
