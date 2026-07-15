from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
def medical_chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    result = chat_service.chat(
        message=body.message,
        history=body.history,
        context=body.context,
    )
    return ChatResponse(**result)
