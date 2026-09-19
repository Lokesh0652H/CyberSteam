from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import alert_service, audit_service
from app.schemas.alerts import PaginatedAlerts, AlertResponse, AlertUpdate
from typing import Optional
from datetime import datetime
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=PaginatedAlerts)
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    rule_id: Optional[int] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    filters = {k: v for k, v in locals().items() if v is not None and k not in ['page', 'page_size', 'db']}
    return alert_service.get_alerts(db, filters, page, page_size)

@router.get("/stats")
def get_alert_stats(db: Session = Depends(get_db)):
    return alert_service.get_alert_stats(db)

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_by_id(alert_id: int, db: Session = Depends(get_db)):
    alert = alert_service.get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(alert_id: int, alert_update: AlertUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    alert = alert_service.update_alert_status(db, alert_id, alert_update.status, current_user.id)
    audit_service.log_action(db, current_user.id, current_user.username, "UPDATE_ALERT_STATUS", "SecurityAlert", str(alert_id), "api", {"new_status": alert_update.status})
    return alert
