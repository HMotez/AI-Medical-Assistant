import pytest
from datetime import datetime, timezone
from pathlib import Path
from app.services.pdf_service import generate, REPORTS_DIR


SAMPLE_PREDICTIONS = [
    {"disease": "Fungal infection", "confidence": 0.88, "rank": 1, "specialist": "Dermatologue"},
    {"disease": "Drug Reaction",    "confidence": 0.08, "rank": 2, "specialist": "Interniste"},
    {"disease": "Acne",             "confidence": 0.04, "rank": 3, "specialist": "Dermatologue"},
]

SAMPLE_EXPLANATION = '{"itching": 0.412, "skin_rash": 0.318, "nodal_skin_eruptions": 0.201}'


def test_pdf_generates_file():
    path = generate(
        analysis_id=1,
        patient_name="Ahmed Benali",
        patient_age=32,
        patient_gender="male",
        symptoms=["itching", "skin_rash", "nodal_skin_eruptions"],
        symptom_duration="5 jours",
        severity=6,
        predictions=SAMPLE_PREDICTIONS,
        urgency_level="low",
        recommended_specialist="Dermatologue",
        explanation_json=SAMPLE_EXPLANATION,
        created_at=datetime.now(timezone.utc),
    )
    assert path.exists()
    assert path.suffix == ".pdf"
    assert path.stat().st_size > 1_000   # at least 1 KB
    path.unlink()                         # cleanup


def test_pdf_emergency_urgency():
    path = generate(
        analysis_id=2,
        patient_name="Sara Mansouri",
        patient_age=55,
        patient_gender="female",
        symptoms=["chest_pain", "breathlessness", "fast_heart_rate"],
        symptom_duration="1 heure",
        severity=9,
        predictions=[
            {"disease": "Heart attack", "confidence": 0.91, "rank": 1, "specialist": "Cardiologue"},
        ],
        urgency_level="emergency",
        recommended_specialist="Cardiologue",
        explanation_json=None,
        created_at=datetime.now(timezone.utc),
    )
    assert path.exists()
    assert path.stat().st_size > 1_000
    path.unlink()


def test_pdf_missing_optional_fields():
    """Should not crash when age/gender/explanation are None."""
    path = generate(
        analysis_id=3,
        patient_name="Patient Inconnu",
        patient_age=None,
        patient_gender=None,
        symptoms=["fatigue"],
        symptom_duration=None,
        severity=None,
        predictions=SAMPLE_PREDICTIONS,
        urgency_level="moderate",
        recommended_specialist="Generaliste",
        explanation_json=None,
        created_at=datetime.now(timezone.utc),
    )
    assert path.exists()
    path.unlink()
