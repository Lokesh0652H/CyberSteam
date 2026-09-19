from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class CyberEvent(BaseModel):
    event_id: str
    timestamp: datetime
    event_type: str
    source_ip: str
    destination_ip: str
    source_port: int
    destination_port: int
    username: Optional[str] = None
    service: str
    endpoint: Optional[str] = None
    http_method: Optional[str] = None
    status_code: Optional[int] = None
    response_time_ms: Optional[int] = None
    country: str
    city: str
    severity: str
    server_id: str
    metadata: Optional[Dict[str, Any]] = None
