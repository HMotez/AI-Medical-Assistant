from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.analysis import UrgencyLevel


class AnalysisCreate(BaseModel):
    symptom_names: list[str]
    symptom_duration: Optional[str] = None
    severity: Optional[int] = None
    additional_info: Optional[str] = None


class PredictionOut(BaseModel):
    disease: str
    confidence: float
    rank: int
    specialist: str


class AnalysisOut(BaseModel):
    id: int
    urgency_level: Optional[UrgencyLevel]
    recommended_specialist: Optional[str]
    explanation: Optional[str]
    predictions: list[PredictionOut]
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisSummary(BaseModel):
    id: int
    urgency_level: Optional[UrgencyLevel]
    recommended_specialist: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TrendPoint(BaseModel):
    analysis_id: int
    date: datetime
    top_disease: str
    confidence: float
    urgency: Optional[str]
    rank_shift: Optional[int] = None  # +N improved / -N worsened vs previous
