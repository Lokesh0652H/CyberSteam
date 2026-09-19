from sqlalchemy.orm import Session
from app.db.models import SecurityRule
from typing import List

def get_rules(db: Session):
    return db.query(SecurityRule).all()

def create_rule(db: Session, rule_data: dict):
    rule = SecurityRule(**rule_data)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

def update_rule(db: Session, rule_id: int, rule_data: dict):
    rule = db.query(SecurityRule).filter(SecurityRule.id == rule_id).first()
    if rule:
        for key, value in rule_data.items():
            if value is not None:
                setattr(rule, key, value)
        db.commit()
        db.refresh(rule)
    return rule

def delete_rule(db: Session, rule_id: int):
    rule = db.query(SecurityRule).filter(SecurityRule.id == rule_id).first()
    if rule:
        db.delete(rule)
        db.commit()
        return True
    return False

def get_active_rules(db: Session) -> List[SecurityRule]:
    return db.query(SecurityRule).filter(SecurityRule.is_active == True).all()
