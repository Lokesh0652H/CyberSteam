from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.db.models import Server, Event, SecurityAlert
from app.schemas.analytics import ServerAnalyticsDetail


def get_servers(db: Session):
    servers = db.query(Server).all()
    result = []
    now = datetime.utcnow()
    one_day_ago = now - timedelta(hours=24)
    
    for srv in servers:
        total_events = db.query(func.count(Event.id)).filter(
            Event.server_id == srv.server_id,
            Event.timestamp >= one_day_ago
        ).scalar() or 0
        
        error_count = db.query(func.count(Event.id)).filter(
            Event.server_id == srv.server_id,
            Event.status_code >= 500,
            Event.timestamp >= one_day_ago
        ).scalar() or 0
        
        avg_response = db.query(func.avg(Event.response_time_ms)).filter(
            Event.server_id == srv.server_id,
            Event.response_time_ms.isnot(None),
            Event.timestamp >= one_day_ago
        ).scalar() or 0.0
        
        alert_count = db.query(func.count(SecurityAlert.id)).filter(
            SecurityAlert.server_id == srv.server_id,
            SecurityAlert.status == "OPEN"
        ).scalar() or 0
        
        last_event = db.query(func.max(Event.timestamp)).filter(
            Event.server_id == srv.server_id
        ).scalar()
        
        result.append(ServerAnalyticsDetail(
            server_id=srv.server_id,
            hostname=srv.hostname,
            status=srv.status.value if srv.status else "ACTIVE",
            environment=srv.environment.value if srv.environment else "PRODUCTION",
            total_events=total_events,
            error_count=error_count,
            error_rate=round(error_count / total_events * 100, 2) if total_events > 0 else 0.0,
            avg_response_time=round(float(avg_response), 2),
            alert_count=alert_count,
            last_activity=last_event.isoformat() if last_event else None
        ))
    
    return result


def get_server_details(db: Session, server_id: str):
    server = db.query(Server).filter(Server.server_id == server_id).first()
    if not server:
        return None
    
    now = datetime.utcnow()
    one_day_ago = now - timedelta(hours=24)
    
    total_events = db.query(func.count(Event.id)).filter(
        Event.server_id == server_id,
        Event.timestamp >= one_day_ago
    ).scalar() or 0
    
    error_count = db.query(func.count(Event.id)).filter(
        Event.server_id == server_id,
        Event.status_code >= 500,
        Event.timestamp >= one_day_ago
    ).scalar() or 0
    
    avg_response = db.query(func.avg(Event.response_time_ms)).filter(
        Event.server_id == server_id,
        Event.response_time_ms.isnot(None),
        Event.timestamp >= one_day_ago
    ).scalar() or 0.0
    
    alert_count = db.query(func.count(SecurityAlert.id)).filter(
        SecurityAlert.server_id == server_id,
        SecurityAlert.status == "OPEN"
    ).scalar() or 0
    
    # Event type breakdown
    event_types = db.query(
        Event.event_type,
        func.count(Event.id).label('count')
    ).filter(
        Event.server_id == server_id,
        Event.timestamp >= one_day_ago
    ).group_by(Event.event_type).order_by(func.count(Event.id).desc()).all()
    
    # Hourly timeline
    hour_label = func.strftime('%Y-%m-%d %H:00:00', Event.timestamp)
    timeline = db.query(
        hour_label.label('hour'),
        func.count(Event.id).label('count')
    ).filter(
        Event.server_id == server_id,
        Event.timestamp >= one_day_ago
    ).group_by(hour_label).order_by(hour_label).all()
    
    # Recent alerts
    alerts = db.query(SecurityAlert).filter(
        SecurityAlert.server_id == server_id
    ).order_by(SecurityAlert.timestamp.desc()).limit(10).all()
    
    last_event = db.query(func.max(Event.timestamp)).filter(
        Event.server_id == server_id
    ).scalar()
    
    return {
        "server_id": server.server_id,
        "hostname": server.hostname,
        "status": server.status.value if server.status else "ACTIVE",
        "environment": server.environment.value if server.environment else "PRODUCTION",
        "os_type": server.os_type,
        "total_events": total_events,
        "error_count": error_count,
        "error_rate": round(error_count / total_events * 100, 2) if total_events > 0 else 0.0,
        "avg_response_time": round(float(avg_response), 2),
        "alert_count": alert_count,
        "last_activity": last_event.isoformat() if last_event else None,
        "event_types": [{"type": et, "count": c} for et, c in event_types],
        "timeline": [{"hour": h.isoformat(), "count": c} for h, c in timeline],
        "recent_alerts": [
            {
                "alert_id": a.alert_id,
                "rule_name": a.rule_name,
                "severity": a.severity,
                "status": a.status.value if a.status else "OPEN",
                "timestamp": a.timestamp.isoformat() if a.timestamp else None,
                "event_count": a.event_count
            } for a in alerts
        ]
    }
