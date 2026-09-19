import os
import shutil

api_dir = r"C:\Users\Lokush\.gemini\antigravity\scratch\cyberstream\backend\app\api"
os.makedirs(api_dir, exist_ok=True)

files = {
    "auth.py": """from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import Token, UserResponse, UserCreate
from app.auth.jwt import create_access_token
from app.auth.dependencies import get_current_user, require_role, pwd_context

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["ADMIN"]))):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=pwd_context.hash(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
""",

    "dashboard.py": """from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import analytics_service
from app.schemas.analytics import DashboardSummary
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return analytics_service.get_dashboard_summary(db)
""",

    "events.py": """from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import event_service
from app.schemas.events import PaginatedEvents, EventStats, EventTimeline
from typing import Optional
from datetime import datetime

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
""",

    "alerts.py": """from fastapi import APIRouter, Depends, HTTPException, Query
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
""",
    
    "analytics.py": """from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/authentication")
def get_auth_analytics(hours: int = 24, db: Session = Depends(get_db)):
    return analytics_service.get_auth_analytics(db, hours)

@router.get("/firewall")
def get_firewall_analytics(hours: int = 24, db: Session = Depends(get_db)):
    return analytics_service.get_firewall_analytics(db, hours)

@router.get("/http")
def get_http_analytics(hours: int = 24, db: Session = Depends(get_db)):
    return analytics_service.get_http_analytics(db, hours)

@router.get("/geography")
def get_geo_analytics(db: Session = Depends(get_db)):
    return analytics_service.get_geo_analytics(db)
"""
}

for name, content in files.items():
    with open(os.path.join(api_dir, name), 'w') as f:
        f.write(content)

print("Generated API routes part 1")
