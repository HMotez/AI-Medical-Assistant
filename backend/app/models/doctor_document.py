from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Documents a doctor must provide to be verified
DOCUMENT_KINDS = ("id_card", "diploma")


class DoctorDocument(Base):
    """An identity or qualification document uploaded by a doctor. Files live in
    uploads/documents and are only served to the owner and to administrators."""
    __tablename__ = "doctor_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(20), nullable=False)             # one of DOCUMENT_KINDS
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(64), nullable=False, unique=True)
    content_type = Column(String(50), nullable=False)
    size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="documents")
