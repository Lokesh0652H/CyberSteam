from pydantic import BaseModel

class AlertSummaryResponse(BaseModel):
    alert_id: int
    summary: str
    model: str
    enabled: bool

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    model: str

class LLMStatusResponse(BaseModel):
    enabled: bool
    provider: str
    model: str
