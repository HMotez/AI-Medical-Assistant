from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserCreate, UserOut, UserUpdate, LoginRequest
from app.schemas.token import Token
from app.services import user_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """Patient sign-up."""
    return user_service.create_user(db, data)


@router.post("/register-doctor", response_model=UserOut, status_code=201)
def register_doctor(
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    phone: str = Form(...),
    specialty: str = Form(...),
    license_number: str = Form(...),
    workplace: Optional[str] = Form(None),
    years_experience: Optional[int] = Form(None),
    gender: Optional[str] = Form(None),
    attest: bool = Form(...),
    id_card: UploadFile = File(...),
    diploma: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Doctor sign-up: professional details + identity card + medical diploma.
    The account can sign in but has no doctor access until an administrator verifies it."""
    if not attest:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You must certify that the information is accurate")
    try:
        account = UserCreate(email=email, password=password, full_name=full_name, phone=phone, gender=gender)
        pro = UserUpdate(specialty=specialty, license_number=license_number,
                         workplace=workplace, years_experience=years_experience)
    except ValidationError as e:
        raise HTTPException(422, e.errors(include_url=False, include_context=False))
    if not pro.specialty or not pro.license_number:
        raise HTTPException(422, "Specialty and licence number are required")
    professional = pro.model_dump(include={"specialty", "license_number", "workplace", "years_experience"})
    return user_service.create_doctor(db, account, professional, {"id_card": id_card, "diploma": diploma})


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    token = user_service.authenticate(db, data.email, data.password)
    return Token(access_token=token)
