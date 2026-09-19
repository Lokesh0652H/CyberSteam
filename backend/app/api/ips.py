from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import ip_service

router = APIRouter(prefix="/api/ips", tags=["ips"])

@router.get("")
def get_ips(page: int = Query(1), page_size: int = Query(50), sort_by: str = "total_events", db: Session = Depends(get_db)):
    return ip_service.get_ips(db, page, page_size, sort_by)

@router.get("/{ip_address}")
def get_ip_details(ip_address: str, db: Session = Depends(get_db)):
    return ip_service.get_ip_details(db, ip_address)
