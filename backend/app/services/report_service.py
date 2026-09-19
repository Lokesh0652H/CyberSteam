import csv
from io import StringIO, BytesIO
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.models import Event, SecurityAlert

def generate_security_report(db: Session, period: str = 'daily') -> dict:
    now = datetime.utcnow()
    if period == 'weekly':
        time_window = now - timedelta(days=7)
    elif period == 'monthly':
        time_window = now - timedelta(days=30)
    else:
        time_window = now - timedelta(hours=24)
        
    total_events = db.query(func.count(Event.id)).filter(Event.timestamp >= time_window).scalar() or 0
    total_alerts = db.query(func.count(SecurityAlert.id)).filter(SecurityAlert.timestamp >= time_window).scalar() or 0
    critical_incidents = db.query(func.count(SecurityAlert.id)).filter(
        SecurityAlert.timestamp >= time_window,
        SecurityAlert.severity == 'CRITICAL'
    ).scalar() or 0

    top_servers_query = db.query(
        Event.server_id.label('server'),
        func.count(Event.id).label('count')
    ).filter(
        Event.timestamp >= time_window,
        Event.server_id.isnot(None)
    ).group_by(Event.server_id).order_by(desc('count')).limit(5).all()
    
    top_sources_query = db.query(
        Event.source_ip.label('ip'),
        func.count(Event.id).label('count')
    ).filter(
        Event.timestamp >= time_window,
        Event.source_ip.isnot(None)
    ).group_by(Event.source_ip).order_by(desc('count')).limit(5).all()

    return {
        "period": period,
        "generated_at": now.isoformat(),
        "total_events": total_events,
        "total_alerts": total_alerts,
        "critical_incidents": critical_incidents,
        "top_servers": [{"server": row.server, "count": row.count} for row in top_servers_query],
        "top_sources": [{"ip": row.ip, "count": row.count} for row in top_sources_query]
    }

def export_csv(db: Session, filters: dict) -> bytes:
    query = db.query(Event).order_by(desc(Event.timestamp)).limit(500)
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["event_id", "timestamp", "event_type", "source_ip", "destination_ip", "username", "server_id", "severity"])
    
    for row in query.all():
        writer.writerow([
            row.event_id,
            row.timestamp.isoformat() if row.timestamp else "",
            row.event_type,
            row.source_ip,
            row.destination_ip or "",
            row.username or "",
            row.server_id or "",
            row.severity or ""
        ])
        
    return output.getvalue().encode('utf-8')

def export_json(db: Session, filters: dict) -> bytes:
    query = db.query(Event).order_by(desc(Event.timestamp)).limit(500)
    data = [
        {
            "event_id": row.event_id,
            "timestamp": row.timestamp.isoformat() if row.timestamp else None,
            "event_type": row.event_type,
            "source_ip": row.source_ip,
            "destination_ip": row.destination_ip,
            "username": row.username,
            "server_id": row.server_id,
            "severity": row.severity
        } for row in query.all()
    ]
    return json.dumps(data, indent=2).encode('utf-8')

def export_pdf(db: Session, report_data: dict) -> bytes:
    report = generate_security_report(db, 'daily')
    text_content = (
        f"CYBERSTREAM DISTRIBUTED SECURITY REPORT\n"
        f"Generated: {datetime.utcnow().isoformat()}\n"
        f"{'=' * 50}\n\n"
        f"SUMMARY METRICS\n"
        f"Total Events Processed: {report['total_events']}\n"
        f"Total Security Alerts: {report['total_alerts']}\n"
        f"Critical Incidents: {report['critical_incidents']}\n\n"
        f"TOP TARGETED SERVERS\n"
    )
    for s in report['top_servers']:
        text_content += f" - {s['server']}: {s['count']} events\n"
    text_content += "\nTOP THREAT SOURCES\n"
    for s in report['top_sources']:
        text_content += f" - {s['ip']}: {s['count']} events\n"
        
    return text_content.encode('utf-8')
