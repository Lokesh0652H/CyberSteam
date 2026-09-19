import os
import shutil

api_dir = r"C:\Users\Lokush\.gemini\antigravity\scratch\cyberstream\backend\app\api"
os.makedirs(api_dir, exist_ok=True)

files = {
    "ips.py": """from fastapi import APIRouter, Depends, Query
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
""",

    "servers.py": """from fastapi import APIRouter, Depends
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
""",

    "rules.py": """from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import rule_service, audit_service
from app.schemas.rules import RuleCreate, RuleResponse, RuleUpdate
from app.auth.dependencies import require_role, get_current_user

router = APIRouter(prefix="/api/rules", tags=["rules"])

@router.get("")
def get_rules(db: Session = Depends(get_db)):
    return rule_service.get_rules(db)

@router.post("", response_model=RuleResponse)
def create_rule(rule: RuleCreate, db: Session = Depends(get_db), current_user = Depends(require_role(["ADMIN"]))):
    created = rule_service.create_rule(db, rule.model_dump())
    audit_service.log_action(db, current_user.id, current_user.username, "CREATE_RULE", "SecurityRule", str(created.id), "api", {})
    return created

@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(rule_id: int, rule: RuleUpdate, db: Session = Depends(get_db), current_user = Depends(require_role(["ADMIN"]))):
    updated = rule_service.update_rule(db, rule_id, rule.model_dump(exclude_unset=True))
    audit_service.log_action(db, current_user.id, current_user.username, "UPDATE_RULE", "SecurityRule", str(rule_id), "api", {})
    return updated

@router.delete("/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db), current_user = Depends(require_role(["ADMIN"]))):
    rule_service.delete_rule(db, rule_id)
    audit_service.log_action(db, current_user.id, current_user.username, "DELETE_RULE", "SecurityRule", str(rule_id), "api", {})
    return {"status": "deleted"}
""",

    "system.py": """from fastapi import APIRouter, Depends
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
""",

    "generator.py": """from fastapi import APIRouter, Depends
from app.auth.dependencies import require_role

router = APIRouter(prefix="/api/generator", tags=["generator"])

@router.post("/start")
def start_generator(current_user = Depends(require_role(["ADMIN"]))):
    return {"status": "started"}

@router.post("/stop")
def stop_generator(current_user = Depends(require_role(["ADMIN"]))):
    return {"status": "stopped"}

@router.post("/rate")
def set_generator_rate(rate: int, current_user = Depends(require_role(["ADMIN"]))):
    return {"status": "rate updated", "rate": rate}

@router.get("/status")
def get_generator_status():
    return {"status": "running"}
""",

    "audit.py": """from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import audit_service
from typing import Optional

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("")
def get_audit_logs(page: int = Query(1), page_size: int = Query(50), username: Optional[str] = None, action: Optional[str] = None, db: Session = Depends(get_db)):
    return audit_service.get_audit_logs(db, page, page_size, {"username": username, "action": action})
""",

    "reports.py": """from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import report_service
from fastapi.responses import Response

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/security")
def get_security_report(period: str = 'daily', db: Session = Depends(get_db)):
    return report_service.generate_security_report(db, period)

@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    csv_bytes = report_service.export_csv(db, {})
    return Response(content=csv_bytes, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=export.csv"})

@router.get("/export/pdf")
def export_pdf(db: Session = Depends(get_db)):
    pdf_bytes = report_service.export_pdf(db, {})
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=report.pdf"})
"""
}

for name, content in files.items():
    with open(os.path.join(api_dir, name), 'w') as f:
        f.write(content)

print("Generated API routes part 2")
