from fastapi import APIRouter, Depends
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
