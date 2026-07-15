from sqlalchemy import Column, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    disease_id = Column(Integer, ForeignKey("diseases.id"), nullable=False)

    confidence_score = Column(Float, nullable=False)   # 0.0 – 1.0
    rank = Column(Integer, nullable=False)             # 1 = most likely
    shap_values = Column(JSON, nullable=True)          # symptom → contribution map

    analysis = relationship("Analysis", back_populates="predictions")
    disease = relationship("Disease", back_populates="predictions")
