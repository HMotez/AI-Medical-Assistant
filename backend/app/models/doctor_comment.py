from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class DoctorComment(Base):
    __tablename__ = "doctor_comments"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), unique=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    comment = Column(Text, nullable=False)
    corrected_disease = Column(Text, nullable=True)   # doctor's own diagnosis if different
    is_validated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    analysis = relationship("Analysis", back_populates="doctor_comment")
    doctor = relationship("User", back_populates="doctor_comments")
