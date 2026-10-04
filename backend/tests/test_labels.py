"""
EN/FR display names shared with the frontend (frontend/src/i18n/medical-labels.json).
"""
from app.services import labels


def test_symptom_labels():
    assert labels.symptom("headache", "en") == "Headache"
    assert labels.symptom("headache", "fr") == "Mal de tête"


def test_disease_and_specialist_labels():
    assert labels.disease("Malaria", "fr") == "Paludisme"
    assert labels.specialist("Dermatologue", "en") == "Dermatologist"


def test_unknown_values_fall_back():
    assert labels.symptom("brand_new_symptom", "fr") == "Brand new symptom"
    assert labels.disease("Unknown disease", "en") == "Unknown disease"


def test_normalize_lang():
    assert labels.normalize_lang("en-US") == "en"
    assert labels.normalize_lang("FR") == "fr"
    assert labels.normalize_lang(None) == labels.DEFAULT_LANG
    assert labels.normalize_lang("de") == labels.DEFAULT_LANG


def test_every_model_symptom_has_labels():
    """Every symptom the trained model knows must have an EN and FR name."""
    import pytest
    from pathlib import Path
    features = Path(__file__).parents[2] / "ml" / "models" / "saved" / "feature_columns.joblib"
    if not features.exists():
        pytest.skip("Model not trained yet")
    import joblib
    missing = [s for s in joblib.load(features) if s not in labels._labels()["symptoms"]]
    assert missing == []
