from fastapi import APIRouter
from app.schemas.llm import ChatRequest, ChatResponse
from app.services import llm_service
import os

router = APIRouter(prefix="/api/assistant", tags=["Assistant"])

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not llm_service.is_enabled():
        return ChatResponse(
            response="LLM assistant is disabled. Set LLM_ENABLED=true and provide LLM_API_KEY in .env",
            model=os.environ.get("LLM_MODEL", "gpt-4o-mini")
        )
        
    response_text = await llm_service.chat(request.message)
    
    return ChatResponse(
        response=response_text,
        model=os.environ.get("LLM_MODEL", "gpt-4o-mini")
    )
