from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"


class DoctorStatus(str, enum.Enum):
    """Doctor accounts are verified by an administrator before they get doctor access."""
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.patient, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Profile (everyone)
    avatar_path = Column(String(64), nullable=True)      # file name in uploads/avatars
    city = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)

    # Medical information (patients)
    blood_type = Column(String(3), nullable=True)
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    allergies = Column(Text, nullable=True)
    chronic_conditions = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)

    # Professional information + verification (doctors)
    specialty = Column(String(100), nullable=True)
    license_number = Column(String(30), nullable=True)
    workplace = Column(String(150), nullable=True)
    years_experience = Column(Integer, nullable=True)
    doctor_status = Column(String(20), nullable=True)    # DoctorStatus value; None for non-doctors
    doctor_review_note = Column(Text, nullable=True)     # reason given when rejected
    doctor_reviewed_at = Column(DateTime(timezone=True), nullable=True)

    analyses = relationship("Analysis", back_populates="patient", foreign_keys="Analysis.patient_id")
    doctor_comments = relationship("DoctorComment", back_populates="doctor")
    documents = relationship("DoctorDocument", back_populates="user", cascade="all, delete-orphan",
                             order_by="DoctorDocument.uploaded_at")

    @property
    def avatar_url(self) -> str | None:
        return f"/api/avatars/{self.avatar_path}" if self.avatar_path else None

    @property
    def is_verified_doctor(self) -> bool:
        return self.role == UserRole.doctor and self.doctor_status == DoctorStatus.approved.value
