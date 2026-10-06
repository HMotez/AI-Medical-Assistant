from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from app.models.user import User, UserRole, DoctorStatus
from app.models.doctor_document import DoctorDocument, DOCUMENT_KINDS
from app.schemas.user import UserCreate, UserUpdate
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.services import upload_service

# Profile fields that only make sense for one role
PATIENT_FIELDS = {"blood_type", "height_cm", "weight_kg", "allergies", "chronic_conditions",
                  "medications", "emergency_contact_name", "emergency_contact_phone"}
DOCTOR_FIELDS = {"specialty", "license_number", "workplace", "years_experience"}


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def _ensure_new_email(db: Session, email: str) -> None:
    if get_by_email(db, email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")


def create_user(db: Session, data: UserCreate) -> User:
    """Self-registration always creates a patient; doctors go through create_doctor."""
    _ensure_new_email(db, data.email)
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        age=data.age,
        gender=data.gender,
        phone=data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_doctor(db: Session, data: UserCreate, professional: dict, files: dict[str, UploadFile]) -> User:
    """A doctor account with its identity card and medical diploma. It stays
    'pending' — no doctor access — until an administrator approves it."""
    _ensure_new_email(db, data.email)
    if set(files) != set(DOCUMENT_KINDS):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Identity card and medical diploma are required")
    # Check every file before creating anything
    checked = {kind: (*upload_service.read_checked(f, upload_service.DOCUMENT_TYPES, settings.DOCUMENT_MAX_BYTES),
                      f.filename or kind) for kind, f in files.items()}

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        gender=data.gender,
        phone=data.phone,
        role=UserRole.doctor,
        doctor_status=DoctorStatus.pending.value,
        **professional,
    )
    db.add(user)
    db.flush()
    saved = []
    try:
        for kind, (content, content_type, original) in checked.items():
            name = upload_service.save("documents", content, content_type)
            saved.append(name)
            db.add(DoctorDocument(user_id=user.id, kind=kind, original_name=original[:255],
                                  stored_name=name, content_type=content_type, size=len(content)))
        db.commit()
    except Exception:
        db.rollback()
        for name in saved:
            upload_service.remove("documents", name)
        raise
    db.refresh(user)
    return user


def replace_document(db: Session, user: User, kind: str, upload: UploadFile) -> DoctorDocument:
    """A doctor waiting for (or refused) verification sends a document again."""
    if user.role != UserRole.doctor:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only doctor accounts have verification documents")
    if user.doctor_status == DoctorStatus.approved.value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your account is already verified")
    if kind not in DOCUMENT_KINDS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown document type")
    content, content_type = upload_service.read_checked(upload, upload_service.DOCUMENT_TYPES, settings.DOCUMENT_MAX_BYTES)
    for old in [d for d in user.documents if d.kind == kind]:
        upload_service.remove("documents", old.stored_name)
        db.delete(old)
    name = upload_service.save("documents", content, content_type)
    doc = DoctorDocument(user_id=user.id, kind=kind, original_name=(upload.filename or kind)[:255],
                         stored_name=name, content_type=content_type, size=len(content))
    db.add(doc)
    # A refused request goes back to the review queue
    user.doctor_status = DoctorStatus.pending.value
    db.commit()
    db.refresh(doc)
    return doc


def review_doctor(db: Session, user: User, approve: bool, reason: str | None = None) -> User:
    if user.role != UserRole.doctor:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This user is not a doctor")
    if approve and {d.kind for d in user.documents} != set(DOCUMENT_KINDS):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Documents are missing")
    user.doctor_status = (DoctorStatus.approved if approve else DoctorStatus.rejected).value
    user.doctor_review_note = None if approve else reason
    user.doctor_reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> str:
    user = get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    return create_access_token(subject=user.id, role=user.role.value)


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    changes = data.model_dump(exclude_unset=True)
    if "full_name" in changes and not changes["full_name"]:
        raise HTTPException(422, "Full name is required")
    not_for_role = (DOCTOR_FIELDS if user.role != UserRole.doctor else set()) | \
                   (PATIENT_FIELDS if user.role != UserRole.patient else set())
    refused = sorted(k for k in changes if k in not_for_role)
    if refused:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Not available for your account: {', '.join(refused)}")
    # The licence number was checked at verification: changing it needs a new review
    if (user.doctor_status == DoctorStatus.approved.value and "license_number" in changes
            and changes["license_number"] != user.license_number):
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "Your licence number was verified; contact an administrator to change it")
    for field, value in changes.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, current: str, new: str) -> None:
    if not verify_password(current, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    user.hashed_password = hash_password(new)
    db.commit()


def set_avatar(db: Session, user: User, upload: UploadFile | None) -> User:
    """Replace (or with None, remove) the profile photo."""
    new_name = upload_service.save_avatar(upload) if upload else None
    upload_service.remove("avatars", user.avatar_path)
    user.avatar_path = new_name
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    user.is_active = False   # soft delete — preserve history
    db.commit()
