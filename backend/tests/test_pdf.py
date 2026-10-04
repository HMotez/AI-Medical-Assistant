import pytest
from datetime import datetime, timezone
from pathlib import Path
from app.services.pdf_service import generate, report_filename


SAMPLE_PREDICTIONS = [
    {"disease": "Fungal infection", "confidence": 0.88, "rank": 1, "specialist": "Dermatologue"},
    {"disease": "Drug Reaction",    "confidence": 0.08, "rank": 2, "specialist": "Interniste"},
    {"disease": "Acne",             "confidence": 0.04, "rank": 3, "specialist": "Dermatologue"},
]

SAMPLE_EXPLANATION = '{"itching": 0.412, "skin_rash": 0.318, "nodal_skin_eruptions": 0.201}'


def test_pdf_generates_file(tmp_path):
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
        output_path=tmp_path / "report.pdf",
    )
    assert path.exists()
    assert path.suffix == ".pdf"
    assert path.stat().st_size > 1_000   # at least 1 KB


def test_pdf_emergency_urgency(tmp_path):
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
        output_path=tmp_path / "report.pdf",
    )
    assert path.exists()
    assert path.stat().st_size > 1_000


def test_pdf_missing_optional_fields(tmp_path):
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
        output_path=tmp_path / "report.pdf",
    )
    assert path.exists()


def test_pdf_handles_non_latin1_text(tmp_path):
    """Typographic dashes/quotes and emoji must not crash the Helvetica-based report."""
    path = generate(
        analysis_id=4,
        patient_name="Zoë “Test” — 🙂",
        patient_age=40,
        patient_gender="female",
        symptoms=["high_fever", "chills"],
        symptom_duration="1–3 days",
        severity=6,
        predictions=SAMPLE_PREDICTIONS,
        urgency_level="high",
        recommended_specialist="Infectiologue",
        explanation_json=SAMPLE_EXPLANATION,
        created_at=datetime.now(timezone.utc),
        output_path=tmp_path / "report.pdf",
    )
    assert path.exists()


@pytest.mark.parametrize("lang, expected", [
    ("fr", ["Symptômes déclarés", "Mal de tête", "Dermatologue", "1 à 3 jours", "Jaunissement"]),
    ("en", ["Reported symptoms", "Headache", "Dermatologist", "1-3 days", "Yellowing"]),
])
def test_pdf_language(tmp_path, monkeypatch, lang, expected):
    from app.services import pdf_service
    written = []
    original = pdf_service.MedicalPDF.normalize_text
    def capture(self, text):
        written.append(str(text))
        return original(self, text)
    monkeypatch.setattr(pdf_service.MedicalPDF, "normalize_text", capture)

    generate(
        analysis_id=5, patient_name="Test", patient_age=30, patient_gender="female",
        symptoms=["headache", "high_fever"], symptom_duration="1_3d", severity=4,
        predictions=SAMPLE_PREDICTIONS, urgency_level="moderate",
        recommended_specialist="Dermatologue", explanation_json=SAMPLE_EXPLANATION,
        created_at=datetime.now(timezone.utc), lang=lang,
        red_flags=[{"code": "jaundice", "level": "moderate", "message": "x"}],
        output_path=tmp_path / "report.pdf",
    )
    text = "\n".join(written)
    for fragment in expected:
        assert fragment in text, fragment


def test_report_filename_is_per_language():
    assert report_filename(7, "en") != report_filename(7, "fr")
    assert report_filename(7, "de") == report_filename(7, "fr")   # unsupported → default
