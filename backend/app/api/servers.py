from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import server_service

router = APIRouter(prefix="/api/servers", tags=["servers"])

@router.get("")
def get_servers(db: Session = Depends(get_db)):
    return server_service.get_servers(db)

@router.get("/{server_id}")
def get_server_details(server_id: str, db: Session = Depends(get_db)):
    return server_service.get_server_details(db, server_id)
