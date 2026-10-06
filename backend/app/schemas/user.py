from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime
from app.models.user import UserRole

PHONE_PATTERN = r"^\+?[0-9 ().-]{6,20}$"
LICENSE_PATTERN = r"^[A-Za-z0-9-]{5,20}$"
BLOOD_TYPES = ("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
Gender = Literal["male", "female", "other"]


def _blank_to_none(value):
    """An empty form field clears the value."""
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)
    age: Optional[int] = Field(default=None, ge=1, le=120)
    gender: Optional[Gender] = None
    phone: Optional[str] = Field(default=None, pattern=PHONE_PATTERN)

    _blank = field_validator("phone", "gender", mode="before")(_blank_to_none)


class UserUpdate(BaseModel):
    """Profile fields a user can change. Send null (or "") to clear an optional field.
    Medical fields are for patients, professional fields for doctors."""
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    age: Optional[int] = Field(default=None, ge=1, le=120)
    gender: Optional[Gender] = None
    phone: Optional[str] = Field(default=None, pattern=PHONE_PATTERN)
    city: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=600)

    blood_type: Optional[Literal[BLOOD_TYPES]] = None
    height_cm: Optional[int] = Field(default=None, ge=40, le=250)
    weight_kg: Optional[float] = Field(default=None, ge=2, le=400)
    allergies: Optional[str] = Field(default=None, max_length=500)
    chronic_conditions: Optional[str] = Field(default=None, max_length=500)
    medications: Optional[str] = Field(default=None, max_length=500)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(default=None, pattern=PHONE_PATTERN)

    specialty: Optional[str] = Field(default=None, max_length=100)
    license_number: Optional[str] = Field(default=None, pattern=LICENSE_PATTERN)
    workplace: Optional[str] = Field(default=None, max_length=150)
    years_experience: Optional[int] = Field(default=None, ge=0, le=70)

    _blank = field_validator(
        "full_name", "gender", "phone", "city", "bio", "blood_type", "allergies", "chronic_conditions",
        "medications", "emergency_contact_name", "emergency_contact_phone", "specialty",
        "license_number", "workplace", mode="before",
    )(_blank_to_none)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    age: Optional[int]
    gender: Optional[str]
    phone: Optional[str]
    is_active: bool
    created_at: datetime

    avatar_url: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None

    blood_type: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    medications: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    specialty: Optional[str] = None
    license_number: Optional[str] = None
    workplace: Optional[str] = None
    years_experience: Optional[int] = None
    doctor_status: Optional[str] = None
    doctor_review_note: Optional[str] = None
    doctor_reviewed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: int
    kind: str
    original_name: str
    content_type: str
    size: int
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class DoctorRequestOut(UserOut):
    """A doctor account with its verification documents (admin view)."""
    documents: List[DocumentOut] = []


class DoctorRejection(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
