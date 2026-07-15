from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatContext(BaseModel):
    top_disease: Optional[str] = None
    symptoms: list[str] = []
    urgency: Optional[str] = None
    specialist: Optional[str] = None
    analysis_id: Optional[int] = None


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    context: Optional[ChatContext] = None


class ChatResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    reply: str
    model_used: str = "rule-based"
