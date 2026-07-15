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
from app.models.user import User, UserRole


def create_admin(
    email: str = "admin@medai.com",
    password: str = "Admin@1234",
    full_name: str = "System Administrator",
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
                db.commit()
                print(f"[OK] Promoted existing user to doctor: {email}")
            return

        doctor = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole.doctor,
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
        print(f"     Password        : {password}")
        print(f"     Login at        : http://localhost:3000/login")
    finally:
        db.close()


if __name__ == "__main__":
    admin_email    = os.getenv("ADMIN_EMAIL",    "admin@medai.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@1234")
    doctor_email    = os.getenv("DOCTOR_EMAIL",    "doctor@medai.com")
    doctor_password = os.getenv("DOCTOR_PASSWORD", "Doctor@1234")
    patient_email    = os.getenv("PATIENT_EMAIL",    "patient@medai.com")
    patient_password = os.getenv("PATIENT_PASSWORD", "Patient@1234")

    print("\n=== AI Medical Assistant — Seed Accounts ===\n")
    create_admin(email=admin_email, password=admin_password)
    create_doctor(email=doctor_email, password=doctor_password)
    create_patient(email=patient_email, password=patient_password)
    print("\nDone. You can now log in with the credentials above.\n")
