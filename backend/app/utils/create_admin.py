"""
Run this script once to create the first admin account.

Usage (from the backend/ directory):
    python -m app.utils.create_admin

Or with custom credentials:
    ADMIN_EMAIL=admin@hospital.com ADMIN_PASSWORD=secret123 python -m app.utils.create_admin
"""

import os
import sys
from pathlib import Path

# Allow running from repo root or backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole, DoctorStatus


def create_admin(
    email: str = "admin@medai.com",
    password: str = "Admin@1234",
    full_name: str = "System Administrator",
    quiet: bool = False,
) -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role == UserRole.admin:
                print(f"[INFO] Admin already exists: {email}")
            else:
                existing.role = UserRole.admin
                db.commit()
                print(f"[OK] Promoted existing user to admin: {email}")
            return

        admin = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"[OK] Admin created  : {email}")
        if not quiet:
            print(f"     Password       : {password}")
        print(f"     Login at       : http://localhost:3000/login")
    finally:
        db.close()


def create_doctor(
    email: str = "doctor@medai.com",
    password: str = "Doctor@1234",
    full_name: str = "Dr. Demo",
) -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role == UserRole.doctor:
                print(f"[INFO] Doctor already exists: {email}")
            else:
                existing.role = UserRole.doctor
                print(f"[OK] Promoted existing user to doctor: {email}")
            # The demo doctor is set up by the admin: verified directly
            existing.doctor_status = DoctorStatus.approved.value
            db.commit()
            return

        doctor = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole.doctor,
            doctor_status=DoctorStatus.approved.value,
            specialty="Médecin généraliste",
            license_number="10001234567",
            workplace="Demo Medical Center",
            years_experience=8,
            is_active=True,
        )
        db.add(doctor)
        db.commit()
        print(f"[OK] Doctor created : {email}")
        print(f"     Password       : {password}")
        print(f"     Login at       : http://localhost:3000/login")
    finally:
        db.close()


def create_patient(
    email: str = "patient@medai.com",
    password: str = "Patient@1234",
    full_name: str = "Demo Patient",
    quiet: bool = False,
) -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"[INFO] Patient already exists: {email}")
            return

        patient = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole.patient,
            age=30,
            gender="male",
            is_active=True,
        )
        db.add(patient)
        db.commit()
        print(f"[OK] Patient created : {email}")
        if not quiet:
            print(f"     Password        : {password}")
        print(f"     Login at        : http://localhost:3000/login")
    finally:
        db.close()


def seed_production() -> None:
    """Production: only the administrator, from ADMIN_EMAIL / ADMIN_PASSWORD.
    The demo doctor is never created (it could read real patients' analyses);
    the demo patient only with DEMO_ACCOUNTS=true. Passwords are never printed."""
    from app.core.config import settings
    email, password = os.getenv("ADMIN_EMAIL", ""), os.getenv("ADMIN_PASSWORD", "")
    if not email or len(password) < 12:
        print("[SKIP] Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) to create the administrator.")
    else:
        create_admin(email=email, password=password, quiet=True)
    if settings.DEMO_ACCOUNTS:
        # the shared demo patient is protected against changes (see user_service.guard_demo)
        create_patient(email="patient@medai.com", password="Patient@1234", quiet=True)


if __name__ == "__main__":
    from app.core.config import settings

    print("\n=== AI Medical Assistant — Seed Accounts ===\n")
    if settings.is_production:
        seed_production()
    else:
        create_admin(email=os.getenv("ADMIN_EMAIL", "admin@medai.com"), password=os.getenv("ADMIN_PASSWORD", "Admin@1234"))
        create_doctor(email=os.getenv("DOCTOR_EMAIL", "doctor@medai.com"), password=os.getenv("DOCTOR_PASSWORD", "Doctor@1234"))
        create_patient(email=os.getenv("PATIENT_EMAIL", "patient@medai.com"), password=os.getenv("PATIENT_PASSWORD", "Patient@1234"))
        print("\nDone. You can now log in with the credentials above.\n")
