from sqlalchemy import Column, Integer, String, Text, Boolean, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

# Many-to-many: analysis ↔ symptom
analysis_symptoms = Table(
    "analysis_symptoms",
    Base.metadata,
    Column("analysis_id", Integer, ForeignKey("analyses.id"), primary_key=True),
    Column("symptom_id", Integer, ForeignKey("symptoms.id"), primary_key=True),
)


class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    name_fr = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    body_system = Column(String(50), nullable=True)  # e.g. respiratory, digestive
    is_active = Column(Boolean, default=True)

    analyses = relationship("Analysis", secondary=analysis_symptoms, back_populates="symptoms")
