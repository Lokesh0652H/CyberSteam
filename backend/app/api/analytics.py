from fastapi import APIRouter, Depends
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
