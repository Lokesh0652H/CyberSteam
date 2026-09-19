from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rule_type: str
    condition_field: str
    condition_operator: str
    threshold: int
    time_window_seconds: int
    severity: str
    group_by_field: Optional[str] = None
    is_active: bool = True

class RuleResponse(RuleCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rule_type: Optional[str] = None
    condition_field: Optional[str] = None
    condition_operator: Optional[str] = None
    threshold: Optional[int] = None
    time_window_seconds: Optional[int] = None
    severity: Optional[str] = None
    group_by_field: Optional[str] = None
    is_active: Optional[bool] = None
