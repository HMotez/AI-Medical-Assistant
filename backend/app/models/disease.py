from sqlalchemy import Column, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    name_fr = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    specialist = Column(String(100), nullable=True)   # e.g. cardiologue, ORL
    icd10_code = Column(String(10), nullable=True)    # international classification code
    is_active = Column(Boolean, default=True)

    predictions = relationship("Prediction", back_populates="disease")
