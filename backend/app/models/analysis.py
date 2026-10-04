from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base
from app.models.symptom import analysis_symptoms


class UrgencyLevel(str, enum.Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    emergency = "emergency"


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Symptom context
    symptom_duration = Column(String(50), nullable=True)   # e.g. "3 days"
    severity = Column(Integer, nullable=True)              # 1–10 scale
    additional_info = Column(Text, nullable=True)
    free_text = Column(Text, nullable=True)                # raw text input for NLP

    # ML result
    urgency_level = Column(SAEnum(UrgencyLevel), nullable=True)
    recommended_specialist = Column(String(100), nullable=True)
    explanation = Column(Text, nullable=True)              # SHAP explanation summary
    ml_details = Column(JSON, nullable=True)               # red flags, follow-up questions, uncertainty

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("User", back_populates="analyses", foreign_keys=[patient_id])
    symptoms = relationship("Symptom", secondary=analysis_symptoms, back_populates="analyses")
    predictions = relationship("Prediction", back_populates="analysis", cascade="all, delete-orphan")
    doctor_comment = relationship("DoctorComment", back_populates="analysis", uselist=False)
    report = relationship("Report", back_populates="analysis", uselist=False)

    @property
    def top_disease(self):
        """Name of the most likely disease (rank 1), if any."""
        top = min(self.predictions, key=lambda p: p.rank, default=None)
        return top.disease.name if top and top.disease else None
