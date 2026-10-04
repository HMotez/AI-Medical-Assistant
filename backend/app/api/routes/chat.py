import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.analysis import Analysis
from app.models.user import User, UserRole
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _load_context(body: ChatRequest, user: User, db: Session) -> tuple[str, Analysis | None]:
    """
    Full analysis context, loaded on the server so the assistant sees every
    prediction, warning sign and the doctor's review. Patients only get their own.
    """
    analysis_id = body.context.analysis_id if body.context else None
    if analysis_id:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis and (user.role != UserRole.patient or analysis.patient_id == user.id):
            return chat_service.describe_analysis(analysis), analysis
    return chat_service._legacy_context(body.context), None


@router.post("/", response_model=ChatResponse)
def medical_chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    context_text, analysis = _load_context(body, current_user, db)
    result = chat_service.chat(
        message=body.message,
        history=body.history,
        language=body.language,
        context_text=context_text,
        analysis=analysis,
    )
    return ChatResponse(**result)


@router.post("/stream")
def medical_chat_stream(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Streams the reply as newline-delimited JSON events (see chat_service.stream_chat)."""
    context_text, analysis = _load_context(body, current_user, db)
    events = chat_service.stream_chat(body.message, body.history, body.language, context_text, analysis)
    return StreamingResponse(
        (json.dumps(event, ensure_ascii=False) + "\n" for event in events),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
