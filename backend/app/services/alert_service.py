from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
from app.db.models import SecurityAlert, AlertStatusEnum
from app.schemas.alerts import PaginatedAlerts, AlertResponse
from typing import Dict, Any

def get_alerts(db: Session, filters: Dict[str, Any], page: int = 1, page_size: int = 50) -> PaginatedAlerts:
    query = db.query(SecurityAlert)
    
    if filters.get("status"):
        query = query.filter(SecurityAlert.status == filters["status"])
    if filters.get("severity"):
        query = query.filter(SecurityAlert.severity == filters["severity"])
    if filters.get("rule_id"):
        query = query.filter(SecurityAlert.rule_id == filters["rule_id"])
    if filters.get("start_time"):
        query = query.filter(SecurityAlert.timestamp >= filters["start_time"])
    if filters.get("end_time"):
        query = query.filter(SecurityAlert.timestamp <= filters["end_time"])

    total = query.count()
    items = query.order_by(desc(SecurityAlert.timestamp)).offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedAlerts(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

def get_alert_by_id(db: Session, alert_id: int):
    return db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()

def update_alert_status(db: Session, alert_id: int, new_status: str, user_id: int = None):
    alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
    if alert:
        alert.status = new_status
        db.commit()
        db.refresh(alert)
    return alert

def create_alert(db: Session, alert_data: dict):
    alert = SecurityAlert(**alert_data)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

def get_alert_stats(db: Session) -> dict:
    severity_counts = db.query(SecurityAlert.severity, func.count(SecurityAlert.id)).group_by(SecurityAlert.severity).all()
    status_counts = db.query(SecurityAlert.status, func.count(SecurityAlert.id)).group_by(SecurityAlert.status).all()
    
    by_sev = {str(s): c for s, c in severity_counts}
    by_stat = {str(s): c for s, c in status_counts}
    total = sum(by_sev.values())

    return {
        "total": total,
        "critical": by_sev.get("CRITICAL", 0),
        "high": by_sev.get("HIGH", 0),
        "medium": by_sev.get("MEDIUM", 0),
        "low": by_sev.get("LOW", 0),
        "open": by_stat.get("OPEN", 0),
        "resolved": by_stat.get("RESOLVED", 0),
        "acknowledged": by_stat.get("ACKNOWLEDGED", 0),
        "by_severity": by_sev,
        "by_status": by_stat
    }
