from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.db.models import Event, EventStatistic
from app.schemas.events import PaginatedEvents, EventStats, EventTimeline, TimelinePoint
from typing import Dict, Any

def get_events(db: Session, filters: Dict[str, Any], page: int = 1, page_size: int = 50) -> PaginatedEvents:
    query = db.query(Event)
    
    if filters.get("event_type"):
        query = query.filter(Event.event_type == filters["event_type"])
    if filters.get("source_ip"):
        query = query.filter(Event.source_ip == filters["source_ip"])
    if filters.get("username"):
        query = query.filter(Event.username == filters["username"])
    if filters.get("server_id"):
        query = query.filter(Event.server_id == filters["server_id"])
    if filters.get("severity"):
        query = query.filter(Event.severity == filters["severity"])
    if filters.get("start_time"):
        query = query.filter(Event.timestamp >= filters["start_time"])
    if filters.get("end_time"):
        query = query.filter(Event.timestamp <= filters["end_time"])

    total = query.count()
    items = query.order_by(desc(Event.timestamp)).offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedEvents(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

def get_recent_events(db: Session, limit: int = 50):
    return db.query(Event).order_by(desc(Event.timestamp)).limit(limit).all()

def get_event_stats(db: Session, window: str = '1h') -> EventStats:
    start_time = datetime.utcnow() - timedelta(hours=1)
    
    total_events = db.query(func.count(Event.id)).filter(Event.timestamp >= start_time).scalar() or 0
    
    type_counts = db.query(Event.event_type, func.count(Event.id)).filter(Event.timestamp >= start_time).group_by(Event.event_type).all()
    events_by_type = {t: c for t, c in type_counts}
    
    severity_counts = db.query(Event.severity, func.count(Event.id)).filter(Event.timestamp >= start_time).group_by(Event.severity).all()
    events_by_severity = {s: c for s, c in severity_counts}
    
    top_ips = db.query(Event.source_ip, func.count(Event.id).label('count'))\
                .filter(Event.timestamp >= start_time)\
                .group_by(Event.source_ip)\
                .order_by(desc('count'))\
                .limit(10).all()
    top_source_ips = [{"ip": ip, "count": count} for ip, count in top_ips]
    
    return EventStats(
        total_events=total_events,
        events_by_type=events_by_type,
        events_by_severity=events_by_severity,
        top_source_ips=top_source_ips
    )

def get_event_timeline(db: Session, hours: int = 24) -> EventTimeline:
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Hourly grouping — uses strftime for SQLite compatibility
    hour_label = func.strftime('%Y-%m-%d %H:00:00', Event.timestamp)
    results = db.query(
        hour_label.label('hour'),
        func.count(Event.id).label('count')
    ).filter(Event.timestamp >= start_time)\
     .group_by(hour_label)\
     .order_by(hour_label).all()
     
    points = [TimelinePoint(timestamp=row.hour, count=row.count) for row in results]
    return EventTimeline(points=points)

def insert_events_batch(db: Session, events: list) -> int:
    # events is a list of dicts
    db.bulk_insert_mappings(Event, events)
    db.commit()
    return len(events)
