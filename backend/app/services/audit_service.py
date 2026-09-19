from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models import AuditLog
import json

def log_action(db: Session, user_id: int, username: str, action: str, resource: str, resource_id: str, ip_address: str, details: dict):
    log = AuditLog(
        user_id=user_id,
        username=username,
        action=action,
        resource=resource,
        resource_id=resource_id,
        ip_address=ip_address,
        details=details
    )
    db.add(log)
    db.commit()
    return log

def get_audit_logs(db: Session, page: int = 1, page_size: int = 50, filters: dict = None):
    query = db.query(AuditLog)
    if filters:
        if filters.get("username"):
            query = query.filter(AuditLog.username == filters["username"])
        if filters.get("action"):
            query = query.filter(AuditLog.action == filters["action"])
            
    total = query.count()
    items = query.order_by(desc(AuditLog.timestamp)).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
