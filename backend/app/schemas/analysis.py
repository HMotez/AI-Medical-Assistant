from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.analysis import UrgencyLevel


class AnalysisCreate(BaseModel):
    symptom_names: list[str] = []
    free_text: Optional[str] = Field(default=None, max_length=2000)
    symptom_duration: Optional[str] = None
    severity: Optional[int] = Field(default=None, ge=1, le=10)
    additional_info: Optional[str] = None


class SymptomTextIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class SymptomMatch(BaseModel):
    phrase: str
    symptom: str
    negated: bool


class SymptomExtractionOut(BaseModel):
    symptoms: list[str]
    negated: list[str]
    matches: list[SymptomMatch]


class PredictionOut(BaseModel):
    disease: str
    confidence: float
    rank: int
    specialist: str


class RedFlag(BaseModel):
    code: Optional[str] = None   # stable id the frontend/PDF translate (older analyses have none)
    level: str
    message: str
    symptoms: list[str]


class FollowUpQuestion(BaseModel):
    symptom: str
    information_gain: float


class AnalysisDetails(BaseModel):
    is_uncertain: bool = False
    red_flags: list[RedFlag] = []
    follow_up_questions: list[FollowUpQuestion] = []
    unknown_symptoms: list[str] = []
    model: Optional[str] = None


class DoctorReview(BaseModel):
    comment: str
    corrected_disease: Optional[str] = None
    is_validated: bool = False
    doctor_name: Optional[str] = None


class AnalysisOut(BaseModel):
    id: int
    urgency_level: Optional[UrgencyLevel]
    recommended_specialist: Optional[str]
    explanation: Optional[str]
    predictions: list[PredictionOut]
    symptoms: list[str] = []
    severity: Optional[int] = None
    symptom_duration: Optional[str] = None
    free_text: Optional[str] = None
    details: AnalysisDetails = AnalysisDetails()
    doctor_review: Optional[DoctorReview] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisSummary(BaseModel):
    id: int
    urgency_level: Optional[UrgencyLevel]
    recommended_specialist: Optional[str]
    top_disease: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TrendPoint(BaseModel):
    analysis_id: int
    date: datetime
    top_disease: str
    confidence: float
    urgency: Optional[str]
    rank_shift: Optional[int] = None  # +N improved / -N worsened vs previous
