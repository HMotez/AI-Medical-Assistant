"""
ML unit tests — runs against the saved model (must train first).
Skip automatically if model files are missing.
"""
import pytest
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent.parent / "ml" / "models" / "saved" / "model.joblib"
pytestmark = pytest.mark.skipif(not MODEL_PATH.exists(), reason="Model not trained yet")


@pytest.fixture(scope="module")
def predictor():
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from ml.src.predictor import Predictor
    return Predictor()


@pytest.fixture(scope="module")
def ml_service():
    from app.services import ml_service
    return ml_service


def test_predict_returns_top5(predictor):
    symptoms = ["itching", "skin_rash", "nodal_skin_eruptions"]
    result = predictor.predict(symptoms, top_n=5)
    assert len(result.top_predictions) == 5


def test_confidence_sums_to_roughly_one(predictor):
    symptoms = ["high_fever", "chills", "sweating", "headache"]
    result = predictor.predict(symptoms)
    total = sum(p.confidence for p in result.top_predictions)
    assert total <= 1.01


def test_ranks_are_ordered(predictor):
    symptoms = ["cough", "breathlessness", "chest_pain"]
    result = predictor.predict(symptoms)
    confidences = [p.confidence for p in result.top_predictions]
    assert confidences == sorted(confidences, reverse=True)


def test_build_vector_length(predictor):
    vector = predictor.build_vector(["cough", "fatigue"])
    assert len(vector) == len(predictor.feature_columns)
    assert sum(vector) == 2


def test_build_vector_normalizes_names(predictor):
    vector = predictor.build_vector(["Spotting Urination", " skin_rash "])
    assert sum(vector) == 2


def test_unknown_symptom_ignored(predictor):
    result = predictor.predict(["cough", "not_a_real_symptom"])
    assert sum(result.symptom_vector) == 1  # only cough matched
    assert result.unknown_symptoms == ["not_a_real_symptom"]


def test_disease_names_are_cleaned(predictor):
    assert "Osteoarthritis" in predictor.classes
    assert "Peptic ulcer disease" in predictor.classes
    assert "Osteoarthristis" not in predictor.classes


def test_single_vague_symptom_is_uncertain(predictor):
    assert predictor.predict(["headache"]).is_uncertain


def test_clear_profile_is_confident(predictor):
    result = predictor.predict(["chest_pain", "breathlessness", "sweating", "vomiting"])
    assert result.top_predictions[0].disease == "Heart attack"
    assert not result.is_uncertain


def test_follow_up_questions_exclude_reported(predictor):
    vector = predictor.build_vector(["high_fever", "chills"])
    questions = predictor.follow_up_questions(vector)
    assert questions
    asked = {q.symptom for q in questions}
    assert not asked & {"high_fever", "chills"}


def test_explanation_covers_reported_symptoms(predictor):
    from ml.src.explainer import Explainer
    result = predictor.predict(["itching", "skin_rash"])
    contributions = Explainer(predictor).explain(result.symptom_vector, result.top_class_index)
    assert set(contributions) == {"itching", "skin_rash"}


# ── Urgency and red flags ───────────────────────────────────────────

def test_red_flag_chest_pain_is_emergency(ml_service):
    result = ml_service.analyze(["chest_pain", "breathlessness"])
    assert result["urgency_level"] == "emergency"
    assert result["recommended_specialist"] == ml_service.EMERGENCY_SPECIALIST
    assert result["details"]["red_flags"][0]["code"] == "heart_attack"


def test_list_diseases(ml_service):
    diseases = {d["name"]: d for d in ml_service.list_diseases()}
    assert len(diseases) == 41
    assert diseases["Heart attack"]["urgency"] == "emergency"
    assert diseases["Malaria"]["specialist"] == "Infectiologue"


def test_stroke_signs_are_emergency_even_alone(ml_service):
    assert ml_service.analyze(["slurred_speech"])["urgency_level"] == "emergency"


def test_vague_symptom_is_not_emergency(ml_service):
    assert ml_service.analyze(["headache"])["urgency_level"] != "emergency"


def test_high_severity_raises_urgency(ml_service):
    normal = ml_service.analyze(["itching", "skin_rash", "nodal_skin_eruptions"])
    severe = ml_service.analyze(["itching", "skin_rash", "nodal_skin_eruptions"], severity=9)
    order = ml_service.URGENCY_ORDER
    assert order.index(severe["urgency_level"]) == order.index(normal["urgency_level"]) + 1


def test_severity_never_creates_emergency(ml_service):
    result = ml_service.analyze(["high_fever", "chills", "sweating"], severity=10)
    assert result["urgency_level"] != "emergency"
