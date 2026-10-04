"""
API integration tests — analysis, chat, and trend endpoints.
Uses an in-memory SQLite DB; ML model is mocked.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from main import app

TEST_DB = "sqlite:///./test_api.db"
engine  = create_engine(TEST_DB, connect_args={"check_same_thread": False})
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

REGISTER = {
    "email": "api_test@example.com",
    "password": "Secure123!",
    "full_name": "API Tester",
    "age": 28,
    "gender": "female",
}

ML_MOCK = {
    "predictions": [
        {"disease": "Fungal infection", "confidence": 0.88, "rank": 1, "specialist": "Dermatologue"},
        {"disease": "Drug Reaction",    "confidence": 0.08, "rank": 2, "specialist": "Interniste"},
        {"disease": "Acne",             "confidence": 0.04, "rank": 3, "specialist": "Dermatologue"},
        {"disease": "Psoriasis",        "confidence": 0.02, "rank": 4, "specialist": "Dermatologue"},
        {"disease": "Impetigo",         "confidence": 0.01, "rank": 5, "specialist": "Dermatologue"},
    ],
    "urgency_level":          "low",
    "recommended_specialist": "Dermatologue",
    "shap_explanation":       {"itching": 0.41, "skin_rash": 0.32},
    "symptom_vector":         [0] * 132,
}


@pytest.fixture(autouse=True)
def setup_db():
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


@pytest.fixture
def auth_client(client):
    """Returns (TestClient, auth_token) after registering + logging in."""
    client.post("/api/auth/register", json=REGISTER)
    login = client.post("/api/auth/login", json={"email": REGISTER["email"], "password": REGISTER["password"]})
    token = login.json()["access_token"]
    return client, token


# ── Analysis endpoints ──────────────────────────────────────────────

def test_run_analysis(auth_client):
    c, token = auth_client
    with patch("app.services.ml_service.analyze", return_value=ML_MOCK):
        res = c.post("/api/analysis/", json={"symptom_names": ["itching", "skin_rash"]},
                     headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    data = res.json()
    assert data["urgency_level"] == "low"
    assert len(data["predictions"]) == 5
    assert data["predictions"][0]["disease"] == "Fungal infection"


def test_analysis_saves_symptoms_and_details(auth_client):
    c, token = auth_client
    details = {
        "is_uncertain": True,
        "red_flags": [{"code": "bleeding", "level": "high", "message": "Bleeding", "symptoms": ["bloody_stool"]}],
        "follow_up_questions": [{"symptom": "nodal_skin_eruptions", "information_gain": 0.4}],
        "unknown_symptoms": [],
        "model": "logistic_regression",
    }
    with patch("app.services.ml_service.analyze", return_value={**ML_MOCK, "details": details}):
        created = c.post("/api/analysis/",
                         json={"symptom_names": ["itching", "skin_rash"], "severity": 7},
                         headers={"Authorization": f"Bearer {token}"}).json()
    data = c.get(f"/api/analysis/{created['id']}", headers={"Authorization": f"Bearer {token}"}).json()
    assert sorted(data["symptoms"]) == ["itching", "skin_rash"]
    assert data["severity"] == 7
    assert data["details"]["is_uncertain"] is True
    assert data["details"]["follow_up_questions"][0]["symptom"] == "nodal_skin_eruptions"
    assert data["details"]["red_flags"][0]["code"] == "bleeding"   # must survive the response schema


def test_analysis_rejects_invalid_severity(auth_client):
    c, token = auth_client
    res = c.post("/api/analysis/", json={"symptom_names": ["itching"], "severity": 15},
                 headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 422


def test_extract_symptoms_endpoint(client):
    extracted = {"symptoms": ["headache"], "negated": ["high_fever"],
                 "matches": [{"phrase": "mal a la tete", "symptom": "headache", "negated": False}]}
    with patch("app.services.ml_service.extract_symptoms", return_value=extracted):
        res = client.post("/api/symptoms/extract", json={"text": "mal à la tête, pas de fièvre"})
    assert res.status_code == 200
    assert res.json()["symptoms"] == ["headache"]


def test_analysis_from_free_text_only(auth_client):
    c, token = auth_client
    with patch("app.services.ml_service.extract_symptoms",
               return_value={"symptoms": ["itching", "skin_rash"], "negated": [], "matches": []}),          patch("app.services.ml_service.analyze", return_value=ML_MOCK) as analyze:
        res = c.post("/api/analysis/", json={"free_text": "my skin is itchy with a rash"},
                     headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    assert analyze.call_args.args[0] == ["itching", "skin_rash"]
    assert res.json()["free_text"] == "my skin is itchy with a rash"


def test_run_analysis_no_symptoms(auth_client):
    c, token = auth_client
    res = c.post("/api/analysis/", json={"symptom_names": []},
                 headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400


def test_list_my_analyses(auth_client):
    c, token = auth_client
    with patch("app.services.ml_service.analyze", return_value=ML_MOCK):
        c.post("/api/analysis/", json={"symptom_names": ["itching"]},
               headers={"Authorization": f"Bearer {token}"})
    res = c.get("/api/analysis/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) >= 1


def test_get_analysis_by_id(auth_client):
    c, token = auth_client
    with patch("app.services.ml_service.analyze", return_value=ML_MOCK):
        created = c.post("/api/analysis/", json={"symptom_names": ["itching"]},
                         headers={"Authorization": f"Bearer {token}"}).json()
    res = c.get(f"/api/analysis/{created['id']}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]


def test_delete_analysis(auth_client):
    c, token = auth_client
    with patch("app.services.ml_service.analyze", return_value=ML_MOCK):
        created = c.post("/api/analysis/", json={"symptom_names": ["itching"]},
                         headers={"Authorization": f"Bearer {token}"}).json()
    res = c.delete(f"/api/analysis/{created['id']}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 204


def test_trend_endpoint(auth_client):
    c, token = auth_client
    with patch("app.services.ml_service.analyze", return_value=ML_MOCK):
        for _ in range(3):
            c.post("/api/analysis/", json={"symptom_names": ["itching", "skin_rash"]},
                   headers={"Authorization": f"Bearer {token}"})
    res = c.get("/api/analysis/trends", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    points = res.json()
    assert isinstance(points, list)
    assert len(points) == 3
    for pt in points:
        assert "top_disease" in pt
        assert "confidence" in pt
        assert "date" in pt


def test_analysis_requires_auth(client):
    res = client.get("/api/analysis/")
    assert res.status_code in (401, 403)


# ── Chat endpoint ───────────────────────────────────────────────────

def test_chat_rule_based(auth_client):
    """When no API key is set the rule-based fallback fires."""
    c, token = auth_client
    with patch("app.core.config.settings.ANTHROPIC_API_KEY", ""):
        res = c.post("/api/chat/", json={"message": "bonjour", "history": []},
                     headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert len(res.json()["reply"]) > 5


def test_chat_with_context(auth_client):
    c, token = auth_client
    with patch("app.core.config.settings.ANTHROPIC_API_KEY", ""):
        res = c.post("/api/chat/", json={
            "message": "What is my condition?",
            "history": [],
            "context": {
                "top_disease": "Fungal infection",
                "symptoms": ["itching", "skin_rash"],
                "urgency": "low",
                "specialist": "Dermatologue",
            },
        }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200


def test_chat_requires_auth(client):
    res = client.post("/api/chat/", json={"message": "hello", "history": []})
    assert res.status_code in (401, 403)


# ── RGPD / Privacy validation ───────────────────────────────────────

def test_register_response_hides_password(client):
    """Hashed password must never appear in any register/me response."""
    res = client.post("/api/auth/register", json=REGISTER)
    assert res.status_code == 201
    body = res.text
    assert "hashed_password" not in body
    assert REGISTER["password"] not in body


def test_me_hides_password(auth_client):
    c, token = auth_client
    res = c.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.text
    assert "hashed_password" not in body
    assert REGISTER["password"] not in body


def test_other_patient_cannot_read_analysis(auth_client, client):
    """A patient must not be able to read another patient's analysis."""
    c, token = auth_client
    with patch("app.services.ml_service.analyze", return_value=ML_MOCK):
        created = c.post("/api/analysis/", json={"symptom_names": ["itching"]},
                         headers={"Authorization": f"Bearer {token}"}).json()

    # Register a second user
    client.post("/api/auth/register", json={**REGISTER, "email": "other@example.com"})
    other_login = client.post("/api/auth/login", json={"email": "other@example.com", "password": REGISTER["password"]})
    other_token = other_login.json()["access_token"]

    res = client.get(f"/api/analysis/{created['id']}", headers={"Authorization": f"Bearer {other_token}"})
    assert res.status_code in (403, 404)


def test_health_endpoint_public(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@pytest.mark.parametrize("language, expected", [("en", "Hello! I'm MedAI"), ("fr", "Bonjour ! Je suis MedAI")])
def test_chat_fallback_follows_language(auth_client, language, expected):
    c, token = auth_client
    with patch("app.core.config.settings.ANTHROPIC_API_KEY", ""):
        res = c.post("/api/chat/", json={"message": "hello", "language": language},
                     headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["reply"].startswith(expected)


def test_summary_includes_top_disease(auth_client):
    c, token = auth_client
    with patch("app.services.ml_service.analyze", return_value=ML_MOCK):
        c.post("/api/analysis/", json={"symptom_names": ["itching"]},
               headers={"Authorization": f"Bearer {token}"})
    res = c.get("/api/analysis/", headers={"Authorization": f"Bearer {token}"})
    assert res.json()[0]["top_disease"] == "Fungal infection"
