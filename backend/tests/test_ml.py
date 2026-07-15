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


def test_unknown_symptom_ignored(predictor):
    vector = predictor.build_vector(["cough", "not_a_real_symptom"])
    assert sum(vector) == 1  # only cough matched
