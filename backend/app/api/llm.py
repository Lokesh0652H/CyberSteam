from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import SecurityAlert
from app.schemas.llm import LLMStatusResponse, AlertSummaryResponse
from app.services import llm_service
import os

router = APIRouter(prefix="/api/llm", tags=["LLM"])

@router.get("/status", response_model=LLMStatusResponse)
def get_status():
    return LLMStatusResponse(
        enabled=llm_service.is_enabled(),
        provider=llm_service.get_provider(),
        model=llm_service.get_model()
    )

@router.get("/alert-summary/{alert_id}", response_model=AlertSummaryResponse)
async def get_alert_summary(alert_id: int, db: Session = Depends(get_db)):
    if not llm_service.is_enabled():
        return AlertSummaryResponse(
            alert_id=alert_id,
            summary="LLM is disabled",
            model=os.environ.get("LLM_MODEL", "gpt-4o-mini"),
            enabled=False
        )
        
    alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert_data = {
        "id": alert.id,
        "alert_id": alert.alert_id,
        "rule_name": alert.rule_name,
        "severity": alert.severity,
        "description": alert.description,
        "source_ip": alert.source_ip,
        "status": alert.status.value if alert.status else None,
    }
    
    summary = await llm_service.summarize_alert(alert_data)
    
    return AlertSummaryResponse(
        alert_id=alert_id,
        summary=summary,
        model=llm_service.get_model(),
        enabled=True
    )
