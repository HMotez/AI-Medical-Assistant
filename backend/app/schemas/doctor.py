from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DoctorCommentCreate(BaseModel):
    comment: str
    corrected_disease: Optional[str] = None
    is_validated: bool = False


class DoctorCommentOut(BaseModel):
    id: int
    analysis_id: int
    doctor_id: int
    comment: str
    corrected_disease: Optional[str]
    is_validated: bool
    created_at: datetime

    model_config = {"from_attributes": True}
