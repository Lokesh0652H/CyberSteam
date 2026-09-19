from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import system_service
from app.schemas.system import SystemHealth, SystemMetrics, KafkaStatus, PipelineStatus

router = APIRouter(tags=["system"])

@router.get("/api/system/health", response_model=SystemHealth)
def get_system_health(db: Session = Depends(get_db)):
    return system_service.check_health(db)

@router.get("/api/system/metrics", response_model=SystemMetrics)
def get_system_metrics():
    return system_service.get_system_metrics()

@router.get("/api/kafka/status", response_model=KafkaStatus)
def get_kafka_status():
    return system_service.get_kafka_status()

@router.get("/api/pipeline/status", response_model=PipelineStatus)
def get_pipeline_status():
    return system_service.get_pipeline_status()
