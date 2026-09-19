from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class AlertCreate(BaseModel):
    alert_id: str
    timestamp: datetime
    rule_id: int
    rule_name: str
    severity: str
    source_ip: Optional[str] = None
    username: Optional[str] = None
    server_id: Optional[str] = None
    description: Optional[str] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    event_count: int = 1

class AlertResponse(AlertCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    created_at: datetime

class AlertUpdate(BaseModel):
    status: str

class AlertFilter(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    rule_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class PaginatedAlerts(BaseModel):
    items: List[AlertResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
