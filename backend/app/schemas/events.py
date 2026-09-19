from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class EventCreate(BaseModel):
    event_id: str
    timestamp: datetime
    event_type: str
    source_ip: str
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    username: Optional[str] = None
    service: Optional[str] = None
    endpoint: Optional[str] = None
    http_method: Optional[str] = None
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    country: Optional[str] = None
    city: Optional[str] = None
    severity: Optional[str] = None
    server_id: Optional[str] = None
    metadata_: Optional[Dict[str, Any]] = None

class EventResponse(EventCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

class EventFilter(BaseModel):
    event_type: Optional[str] = None
    source_ip: Optional[str] = None
    username: Optional[str] = None
    server_id: Optional[str] = None
    severity: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class EventStats(BaseModel):
    total_events: int
    events_by_type: Dict[str, int]
    events_by_severity: Dict[str, int]
    top_source_ips: List[Dict[str, Any]]

class TimelinePoint(BaseModel):
    timestamp: Any
    count: int

class EventTimeline(BaseModel):
    points: List[TimelinePoint]

class PaginatedEvents(BaseModel):
    items: List[EventResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
