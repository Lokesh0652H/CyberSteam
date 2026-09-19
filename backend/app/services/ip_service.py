from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.db.models import IPAddress, Event, SecurityAlert
from app.schemas.analytics import IPAnalyticsDetail


def get_ips(db: Session, page: int = 1, page_size: int = 20, sort_by: str = "total_events"):
    query = db.query(IPAddress)
    total = query.count()
    
    if sort_by == "total_events":
        query = query.order_by(IPAddress.total_events.desc())
    elif sort_by == "failed_events":
        query = query.order_by(IPAddress.failed_events.desc())
    elif sort_by == "blocked_events":
        query = query.order_by(IPAddress.blocked_events.desc())
    elif sort_by == "risk_level":
        query = query.order_by(IPAddress.risk_level.desc())
    else:
        query = query.order_by(IPAddress.total_events.desc())
    
    ips = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": [
            {
                "ip_address": ip.ip_address,
                "country": ip.country,
                "city": ip.city,
                "total_events": ip.total_events or 0,
                "failed_events": ip.failed_events or 0,
                "blocked_events": ip.blocked_events or 0,
                "first_seen": ip.first_seen.isoformat() if ip.first_seen else None,
                "last_seen": ip.last_seen.isoformat() if ip.last_seen else None,
                "risk_level": ip.risk_level.value if ip.risk_level else "LOW"
            }
            for ip in ips
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


def get_ip_details(db: Session, ip_address: str):
    ip_record = db.query(IPAddress).filter(IPAddress.ip_address == ip_address).first()
    
    now = datetime.utcnow()
    one_day_ago = now - timedelta(hours=24)
    
    total_events = db.query(func.count(Event.id)).filter(
        Event.source_ip == ip_address
    ).scalar() or 0
    
    failed_logins = db.query(func.count(Event.id)).filter(
        Event.source_ip == ip_address,
        Event.event_type == "LOGIN_FAILURE"
    ).scalar() or 0
    
    successful_logins = db.query(func.count(Event.id)).filter(
        Event.source_ip == ip_address,
        Event.event_type == "LOGIN_SUCCESS"
    ).scalar() or 0
    
    firewall_blocks = db.query(func.count(Event.id)).filter(
        Event.source_ip == ip_address,
        Event.event_type == "FIREWALL_BLOCK"
    ).scalar() or 0
    
    http_requests = db.query(func.count(Event.id)).filter(
        Event.source_ip == ip_address,
        Event.event_type.in_(["HTTP_REQUEST", "API_REQUEST"])
    ).scalar() or 0
    
    first_seen = db.query(func.min(Event.timestamp)).filter(
        Event.source_ip == ip_address
    ).scalar()
    
    last_seen = db.query(func.max(Event.timestamp)).filter(
        Event.source_ip == ip_address
    ).scalar()
    
    # Event type breakdown
    event_types = db.query(
        Event.event_type,
        func.count(Event.id).label('count')
    ).filter(
        Event.source_ip == ip_address
    ).group_by(Event.event_type).order_by(func.count(Event.id).desc()).all()
    
    # Targeted servers
    targeted_servers = db.query(
        Event.server_id
    ).filter(
        Event.source_ip == ip_address,
        Event.server_id.isnot(None)
    ).distinct().all()
    
    # Associated alerts
    alerts = db.query(SecurityAlert).filter(
        SecurityAlert.source_ip == ip_address
    ).order_by(SecurityAlert.timestamp.desc()).limit(10).all()
    
    # Determine risk level from alerts and event patterns
    risk_level = "LOW"
    if len(alerts) >= 5 or firewall_blocks >= 50:
        risk_level = "CRITICAL"
    elif len(alerts) >= 3 or firewall_blocks >= 20:
        risk_level = "HIGH"
    elif len(alerts) >= 1 or failed_logins >= 10:
        risk_level = "MEDIUM"
    
    return IPAnalyticsDetail(
        ip_address=ip_address,
        country=ip_record.country if ip_record else None,
        city=ip_record.city if ip_record else None,
        total_events=total_events,
        failed_events=failed_logins,
        blocked_events=firewall_blocks,
        first_seen=first_seen.isoformat() if first_seen else None,
        last_seen=last_seen.isoformat() if last_seen else None,
        risk_level=risk_level,
        event_types=[{"type": et, "count": c} for et, c in event_types],
        targeted_servers=[s[0] for s in targeted_servers],
        associated_alerts=[
            {
                "alert_id": a.alert_id,
                "rule_name": a.rule_name,
                "severity": a.severity,
                "status": a.status.value if a.status else "OPEN",
                "timestamp": a.timestamp.isoformat() if a.timestamp else None,
                "event_count": a.event_count
            } for a in alerts
        ]
    )


def update_ip_stats(db: Session, ip_address: str, country: str = None, city: str = None,
                    is_failed: bool = False, is_blocked: bool = False):
    """Update IP statistics when new events are processed."""
    ip_record = db.query(IPAddress).filter(IPAddress.ip_address == ip_address).first()
    now = datetime.utcnow()
    
    if not ip_record:
        ip_record = IPAddress(
            ip_address=ip_address,
            country=country,
            city=city,
            total_events=1,
            failed_events=1 if is_failed else 0,
            blocked_events=1 if is_blocked else 0,
            first_seen=now,
            last_seen=now
        )
        db.add(ip_record)
    else:
        ip_record.total_events = (ip_record.total_events or 0) + 1
        if is_failed:
            ip_record.failed_events = (ip_record.failed_events or 0) + 1
        if is_blocked:
            ip_record.blocked_events = (ip_record.blocked_events or 0) + 1
        ip_record.last_seen = now
        if country and not ip_record.country:
            ip_record.country = country
        if city and not ip_record.city:
            ip_record.city = city
    
    db.commit()
