"""
Bridge between FastAPI and the ML predictor/explainer.
Loaded at startup via lifespan; not imported at module level to avoid cold-start penalty.
"""
from __future__ import annotations
import sys
from pathlib import Path

# Make the ml package importable from the backend working directory
ML_ROOT = Path(__file__).parent.parent.parent.parent / "ml"
if str(ML_ROOT.parent) not in sys.path:
    sys.path.insert(0, str(ML_ROOT.parent))

from ml.src.predictor import Predictor, PredictionResult
from ml.src.explainer import Explainer  # lightweight LOO explainer, no shap needed

URGENCY_RULES = {
    "Heart attack":                    "emergency",
    "Paralysis (brain hemorrhage)":    "emergency",
    "AIDS":                            "high",
    "Tuberculosis":                    "high",
    "Malaria":                         "high",
    "Dengue":                          "high",
    "Hepatitis B":                     "high",
    "Hepatitis C":                     "high",
    "Hepatitis D":                     "high",
    "Hepatitis E":                     "high",
    "Alcoholic hepatitis":             "high",
    "Jaundice":                        "moderate",
    "Pneumonia":                       "moderate",
    "Diabetes":                        "moderate",
    "Typhoid":                         "moderate",
}

SPECIALIST_MAP = {
    "Fungal infection":                "Dermatologue",
    "Allergy":                         "Allergologue",
    "GERD":                            "Gastro-entérologue",
    "Chronic cholestasis":             "Gastro-entérologue",
    "Drug Reaction":                   "Interniste",
    "Peptic ulcer disease":            "Gastro-entérologue",
    "AIDS":                            "Infectiologue",
    "Diabetes":                        "Endocrinologue",
    "Gastroenteritis":                 "Gastro-entérologue",
    "Bronchial Asthma":                "Pneumologue",
    "Hypertension":                    "Cardiologue",
    "Migraine":                        "Neurologue",
    "Cervical spondylosis":            "Rhumatologue",
    "Paralysis (brain hemorrhage)":    "Neurologue",
    "Jaundice":                        "Gastro-entérologue",
    "Malaria":                         "Infectiologue",
    "Chicken pox":                     "Infectiologue",
    "Dengue":                          "Infectiologue",
    "Typhoid":                         "Infectiologue",
    "hepatitis A":                     "Gastro-entérologue",
    "Hepatitis B":                     "Hépatologue",
    "Hepatitis C":                     "Hépatologue",
    "Hepatitis D":                     "Hépatologue",
    "Hepatitis E":                     "Hépatologue",
    "Alcoholic hepatitis":             "Hépatologue",
    "Tuberculosis":                    "Pneumologue",
    "Common Cold":                     "Médecin généraliste",
    "Pneumonia":                       "Pneumologue",
    "Dimorphic hemmorhoids(piles)":    "Chirurgien",
    "Heart attack":                    "Cardiologue",
    "Varicose veins":                  "Cardiologue",
    "Hypothyroidism":                  "Endocrinologue",
    "Hyperthyroidism":                 "Endocrinologue",
    "Hypoglycemia":                    "Endocrinologue",
    "Osteoarthritis":                  "Rhumatologue",
    "Arthritis":                       "Rhumatologue",
    "(vertigo) Paroymsal  Positional Vertigo": "ORL",
    "Acne":                            "Dermatologue",
    "Urinary tract infection":         "Urologue",
    "Psoriasis":                       "Dermatologue",
    "Impetigo":                        "Dermatologue",
}


def analyze(symptom_names: list[str]) -> dict:
    """
    Full analysis pipeline:
      1. Predict top-5 diseases
      2. Compute SHAP explanation for #1 prediction
      3. Map urgency + specialist
    Returns a JSON-serialisable dict.
    """
    predictor = Predictor.get()
    result: PredictionResult = predictor.predict(symptom_names, top_n=5)

    explainer = Explainer()
    shap_contributions = explainer.explain(
        result.symptom_vector,
        result.top_class_index,
    )

    top_disease = result.top_predictions[0].disease
    urgency    = URGENCY_RULES.get(top_disease, "low")
    specialist = SPECIALIST_MAP.get(top_disease, "Médecin généraliste")

    return {
        "predictions": [
            {
                "disease":    p.disease,
                "confidence": round(p.confidence, 4),
                "rank":       p.rank,
                "specialist": SPECIALIST_MAP.get(p.disease, "Médecin généraliste"),
            }
            for p in result.top_predictions
        ],
        "urgency_level":          urgency,
        "recommended_specialist": specialist,
        "shap_explanation":       shap_contributions,
        "symptom_vector":         result.symptom_vector,
    }


def get_all_symptoms() -> list[str]:
    return Predictor.get().feature_columns
