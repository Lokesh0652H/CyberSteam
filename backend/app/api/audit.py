from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import audit_service
from typing import Optional

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("")
def get_audit_logs(page: int = Query(1), page_size: int = Query(50), username: Optional[str] = None, action: Optional[str] = None, db: Session = Depends(get_db)):
    return audit_service.get_audit_logs(db, page, page_size, {"username": username, "action": action})
