"""
Profiles (fields, photo, password) and doctor verification (sign-up with
documents, pending access, admin review, document access rules).
"""
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.services.upload_service import strip_jpeg_metadata
from main import app

engine = create_engine("sqlite:///./test_profile.db", connect_args={"check_same_thread": False})
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF = b"%PDF-1.4\n" + b"0" * 64
JPEG_WITH_EXIF = (b"\xff\xd8"
                  + b"\xff\xe0\x00\x06JFIF"                    # APP0 — kept
                  + b"\xff\xe1\x00\x0aExifGPS!"                # APP1 (EXIF / GPS) — removed
                  + b"\xff\xda\x00\x04\x00\x00" + b"\x11\x22"  # start of scan + data
                  + b"\xff\xd9")

PATIENT = {"email": "pat@example.com", "password": "Secure123!", "full_name": "Pat Ient"}
DOCTOR_FORM = {
    "email": "doc@example.com", "password": "Secure123!", "full_name": "Dr Who",
    "phone": "+33 6 12 34 56 78", "specialty": "Cardiologue", "license_number": "10012345678",
    "workplace": "CHU", "years_experience": "12", "attest": "true",
}


@pytest.fixture(autouse=True)
def setup(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path / "uploads"))
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def login(client, email, password="Secure123!"):
    token = client.post("/api/auth/login", json={"email": email, "password": password}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient(client):
    client.post("/api/auth/register", json=PATIENT)
    return login(client, PATIENT["email"])


@pytest.fixture
def admin(client):
    db = Session()
    db.add(User(email="admin@example.com", hashed_password=hash_password("Secure123!"),
                full_name="Admin", role=UserRole.admin))
    db.commit()
    db.close()
    return login(client, "admin@example.com")


def register_doctor(client, **files):
    files = files or {"id_card": ("id.png", PNG, "image/png"), "diploma": ("diploma.pdf", PDF, "application/pdf")}
    return client.post("/api/auth/register-doctor", data=DOCTOR_FORM, files=files)


# ── Profile ───────────────────────────────────────────────────────────────────
def test_update_full_patient_profile(client, patient):
    res = client.put("/api/users/me", headers=patient, json={
        "city": "Lyon", "bio": "Runner", "blood_type": "O+", "height_cm": 178, "weight_kg": 72.5,
        "allergies": "Penicillin", "emergency_contact_name": "Sam", "emergency_contact_phone": "+33 6 00 00 00 00",
    })
    assert res.status_code == 200
    body = res.json()
    assert body["blood_type"] == "O+" and body["weight_kg"] == 72.5 and body["city"] == "Lyon"


def test_empty_string_clears_a_field(client, patient):
    client.put("/api/users/me", headers=patient, json={"city": "Lyon"})
    assert client.put("/api/users/me", headers=patient, json={"city": ""}).json()["city"] is None


@pytest.mark.parametrize("bad", [
    {"blood_type": "Z+"}, {"height_cm": 900}, {"phone": "call me"}, {"gender": "robot"}, {"full_name": ""},
])
def test_profile_validation(client, patient, bad):
    assert client.put("/api/users/me", headers=patient, json=bad).status_code == 422


def test_patient_cannot_set_doctor_fields(client, patient):
    res = client.put("/api/users/me", headers=patient, json={"license_number": "12345678"})
    assert res.status_code == 400


def test_change_password(client, patient):
    wrong = client.put("/api/users/me/password", headers=patient,
                       json={"current_password": "nope", "new_password": "NewPass123!"})
    assert wrong.status_code == 400
    ok = client.put("/api/users/me/password", headers=patient,
                    json={"current_password": "Secure123!", "new_password": "NewPass123!"})
    assert ok.status_code == 204
    assert client.post("/api/auth/login", json={"email": PATIENT["email"], "password": "NewPass123!"}).status_code == 200


# ── Profile photo ─────────────────────────────────────────────────────────────
def test_avatar_upload_serve_and_delete(client, patient):
    res = client.post("/api/users/me/avatar", headers=patient, files={"file": ("me.png", PNG, "image/png")})
    assert res.status_code == 200
    url = res.json()["avatar_url"]
    assert url.startswith("/api/avatars/") and url.endswith(".png")
    served = client.get(url)
    assert served.status_code == 200 and served.content == PNG
    assert client.delete("/api/users/me/avatar", headers=patient).json()["avatar_url"] is None
    assert client.get(url).status_code == 404          # the old file is gone


def test_avatar_checks_real_content_not_the_name(client, patient):
    fake = client.post("/api/users/me/avatar", headers=patient,
                       files={"file": ("photo.png", b"<script>alert(1)</script>", "image/png")})
    assert fake.status_code == 415


def test_avatar_size_limit(client, patient, monkeypatch):
    monkeypatch.setattr(settings, "AVATAR_MAX_BYTES", 32)
    res = client.post("/api/users/me/avatar", headers=patient, files={"file": ("me.png", PNG, "image/png")})
    assert res.status_code == 413


def test_avatar_path_traversal_is_refused(client):
    assert client.get("/api/avatars/..%2F..%2Fmain.py").status_code == 404


def test_jpeg_metadata_is_removed():
    clean = strip_jpeg_metadata(JPEG_WITH_EXIF)
    assert b"ExifGPS" not in clean
    assert b"JFIF" in clean and clean.endswith(b"\x11\x22\xff\xd9")


# ── Doctor verification ───────────────────────────────────────────────────────
def test_doctor_signup_requires_both_documents(client):
    res = register_doctor(client, id_card=("id.png", PNG, "image/png"))
    assert res.status_code == 422


def test_doctor_signup_rejects_fake_document(client):
    res = register_doctor(client, id_card=("id.pdf", b"not a pdf", "application/pdf"),
                          diploma=("d.pdf", PDF, "application/pdf"))
    assert res.status_code == 415
    # nothing was created
    assert client.post("/api/auth/login", json={"email": DOCTOR_FORM["email"], "password": "Secure123!"}).status_code == 401


def test_doctor_signup_must_attest(client):
    res = client.post("/api/auth/register-doctor", data={**DOCTOR_FORM, "attest": "false"},
                      files={"id_card": ("id.png", PNG, "image/png"), "diploma": ("d.pdf", PDF, "application/pdf")})
    assert res.status_code == 400


def test_pending_doctor_has_no_doctor_access(client):
    res = register_doctor(client)
    assert res.status_code == 201
    assert res.json()["role"] == "doctor" and res.json()["doctor_status"] == "pending"
    doctor = login(client, DOCTOR_FORM["email"])
    assert client.get("/api/users/me", headers=doctor).status_code == 200        # can sign in
    assert client.get("/api/doctor/analyses", headers=doctor).status_code == 403  # but no doctor access


def test_admin_approves_doctor(client, admin):
    register_doctor(client)
    queue = client.get("/api/admin/doctor-requests", headers=admin).json()
    assert len(queue) == 1 and {d["kind"] for d in queue[0]["documents"]} == {"id_card", "diploma"}
    doc_id = queue[0]["id"]
    approved = client.post(f"/api/admin/doctors/{doc_id}/approve", headers=admin)
    assert approved.json()["doctor_status"] == "approved"
    doctor = login(client, DOCTOR_FORM["email"])
    assert client.get("/api/doctor/analyses", headers=doctor).status_code == 200
    assert client.get("/api/admin/doctor-requests", headers=admin).json() == []


def test_rejected_doctor_resubmits(client, admin):
    register_doctor(client)
    doc_id = client.get("/api/admin/doctor-requests", headers=admin).json()[0]["id"]
    rejected = client.post(f"/api/admin/doctors/{doc_id}/reject", headers=admin, json={"reason": "Diploma unreadable"})
    assert rejected.json()["doctor_status"] == "rejected"
    assert rejected.json()["doctor_review_note"] == "Diploma unreadable"

    doctor = login(client, DOCTOR_FORM["email"])
    res = client.post("/api/users/me/documents", headers=doctor, data={"kind": "diploma"},
                      files={"file": ("diploma-hd.pdf", PDF, "application/pdf")})
    assert res.status_code == 201
    me = client.get("/api/users/me", headers=doctor).json()
    assert me["doctor_status"] == "pending"                                       # back in the queue
    assert len(client.get("/api/users/me/documents", headers=doctor).json()) == 2  # replaced, not added


def test_documents_only_for_owner_and_admin(client, admin, patient):
    register_doctor(client)
    doc = client.get("/api/admin/doctor-requests", headers=admin).json()[0]["documents"][0]
    assert client.get(f"/api/documents/{doc['id']}", headers=admin).status_code == 200
    assert client.get(f"/api/documents/{doc['id']}", headers=login(client, DOCTOR_FORM["email"])).status_code == 200
    assert client.get(f"/api/documents/{doc['id']}", headers=patient).status_code == 404
    assert client.get(f"/api/documents/{doc['id']}").status_code in (401, 403)


def test_verified_licence_number_is_locked(client, admin):
    register_doctor(client)
    doc_id = client.get("/api/admin/doctor-requests", headers=admin).json()[0]["id"]
    client.post(f"/api/admin/doctors/{doc_id}/approve", headers=admin)
    doctor = login(client, DOCTOR_FORM["email"])
    assert client.put("/api/users/me", headers=doctor, json={"license_number": "99999999"}).status_code == 400
    assert client.put("/api/users/me", headers=doctor, json={"workplace": "Clinique"}).status_code == 200


def test_patient_signup_cannot_choose_doctor_role(client):
    res = client.post("/api/auth/register", json={**PATIENT, "role": "doctor"})
    assert res.status_code == 201 and res.json()["role"] == "patient"
