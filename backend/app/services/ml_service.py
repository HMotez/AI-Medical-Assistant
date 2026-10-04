"""
Bridge between FastAPI and the ML predictor/explainer.
Loaded at startup via lifespan; not imported at module level to avoid cold-start penalty.
"""
from __future__ import annotations
import sys
from pathlib import Path
from typing import Optional

# Make the ml package importable from the backend working directory
ML_ROOT = Path(__file__).parent.parent.parent.parent / "ml"
if str(ML_ROOT.parent) not in sys.path:
    sys.path.insert(0, str(ML_ROOT.parent))

from ml.src.predictor import Predictor, PredictionResult
from ml.src.explainer import Explainer  # lightweight LOO explainer, no shap needed
from ml.src.dataset import normalize_symptom
from ml.src.text_parser import SymptomTextParser

URGENCY_ORDER = ["low", "moderate", "high", "emergency"]

# A disease raises urgency to its full level only when the model is fairly sure of it;
# a merely possible disease (>= POSSIBLE_CONFIDENCE) raises it to "moderate" at most.
LIKELY_CONFIDENCE   = 0.5
POSSIBLE_CONFIDENCE = 0.2

# Severity (1–10) at or above this raises urgency one level (never up to emergency)
HIGH_SEVERITY = 8

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

# Symptom combinations that need attention whatever the model predicts.
# A rule fires when all of `all` are present and (if given) at least one of `any`.
# `code` lets the frontend and PDF show the message in the user's language.
RED_FLAG_RULES = [
    {
        "code": "heart_attack",
        "all": {"chest_pain"}, "any": {"breathlessness", "sweating", "fast_heart_rate", "palpitations"},
        "level": "emergency",
        "message": "Chest pain with breathlessness, sweating or a racing heart can signal a heart attack.",
    },
    {
        "code": "stroke",
        "all": set(), "any": {"weakness_of_one_body_side", "slurred_speech"},
        "level": "emergency",
        "message": "Sudden weakness on one side or slurred speech can be signs of a stroke.",
    },
    {
        "code": "consciousness",
        "all": set(), "any": {"altered_sensorium", "coma"},
        "level": "emergency",
        "message": "Confusion or reduced consciousness needs immediate medical care.",
    },
    {
        "code": "meningitis",
        "all": {"high_fever", "stiff_neck"}, "any": set(),
        "level": "emergency",
        "message": "High fever with a stiff neck can indicate meningitis.",
    },
    {
        "code": "liver_failure",
        "all": {"acute_liver_failure"}, "any": set(),
        "level": "emergency",
        "message": "Signs of acute liver failure need immediate medical care.",
    },
    {
        "code": "bleeding",
        "all": set(), "any": {"stomach_bleeding", "bloody_stool", "blood_in_sputum"},
        "level": "high",
        "message": "Bleeding (in stool, vomit or sputum) should be checked by a doctor promptly.",
    },
    {
        "code": "lung_infection",
        "all": {"breathlessness", "high_fever"}, "any": set(),
        "level": "high",
        "message": "Breathlessness with high fever can indicate a serious lung infection.",
    },
    {
        "code": "jaundice",
        "all": set(), "any": {"yellowing_of_eyes", "yellowish_skin"},
        "level": "moderate",
        "message": "Yellowing of the skin or eyes suggests a liver problem and should be assessed.",
    },
]

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
    "Hepatitis A":                     "Gastro-entérologue",
    "Hepatitis B":                     "Hépatologue",
    "Hepatitis C":                     "Hépatologue",
    "Hepatitis D":                     "Hépatologue",
    "Hepatitis E":                     "Hépatologue",
    "Alcoholic hepatitis":             "Hépatologue",
    "Tuberculosis":                    "Pneumologue",
    "Common Cold":                     "Médecin généraliste",
    "Pneumonia":                       "Pneumologue",
    "Hemorrhoids (piles)":             "Chirurgien",
    "Heart attack":                    "Cardiologue",
    "Varicose veins":                  "Cardiologue",
    "Hypothyroidism":                  "Endocrinologue",
    "Hyperthyroidism":                 "Endocrinologue",
    "Hypoglycemia":                    "Endocrinologue",
    "Osteoarthritis":                  "Rhumatologue",
    "Arthritis":                       "Rhumatologue",
    "Paroxysmal Positional Vertigo":   "ORL",
    "Acne":                            "Dermatologue",
    "Urinary Tract Infection":         "Urologue",
    "Psoriasis":                       "Dermatologue",
    "Impetigo":                        "Dermatologue",
}

EMERGENCY_SPECIALIST = "Urgences"


def _max_level(*levels: str) -> str:
    return max(levels, key=URGENCY_ORDER.index)


def detect_red_flags(symptom_names: list[str]) -> list[dict]:
    present = {normalize_symptom(s) for s in symptom_names}
    flags = []
    for rule in RED_FLAG_RULES:
        if not rule["all"] <= present:
            continue
        matched_any = rule["any"] & present
        if rule["any"] and not matched_any:
            continue
        flags.append({
            "code":     rule["code"],
            "level":    rule["level"],
            "message":  rule["message"],
            "symptoms": sorted(rule["all"] | matched_any),
        })
    return flags


def compute_urgency(predictions, red_flags: list[dict], severity: Optional[int]) -> str:
    level = "low"
    for p in predictions:
        disease_level = URGENCY_RULES.get(p.disease, "low")
        if p.confidence >= LIKELY_CONFIDENCE:
            level = _max_level(level, disease_level)
        elif p.confidence >= POSSIBLE_CONFIDENCE and disease_level != "low":
            level = _max_level(level, "moderate")
    for flag in red_flags:
        level = _max_level(level, flag["level"])
    if severity is not None and severity >= HIGH_SEVERITY and level in ("low", "moderate"):
        level = URGENCY_ORDER[URGENCY_ORDER.index(level) + 1]
    return level


def analyze(symptom_names: list[str], severity: Optional[int] = None) -> dict:
    """
    Full analysis pipeline:
      1. Predict top-5 diseases (calibrated probabilities)
      2. Explain the #1 prediction (leave-one-out attribution)
      3. Urgency from likely diseases + symptom red flags + severity
      4. Suggest follow-up symptoms that would best narrow the diagnosis
    Returns a JSON-serialisable dict.
    """
    predictor = Predictor.get()
    result: PredictionResult = predictor.predict(symptom_names, top_n=5)

    contributions = Explainer(predictor).explain(result.symptom_vector, result.top_class_index)
    red_flags = detect_red_flags(symptom_names)
    urgency = compute_urgency(result.top_predictions, red_flags, severity)

    top_disease = result.top_predictions[0].disease
    specialist = (
        EMERGENCY_SPECIALIST if urgency == "emergency"
        else SPECIALIST_MAP.get(top_disease, "Médecin généraliste")
    )

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
        "shap_explanation":       contributions,
        "symptom_vector":         result.symptom_vector,
        "details": {
            "is_uncertain":        result.is_uncertain,
            "red_flags":           red_flags,
            "follow_up_questions": [
                {"symptom": q.symptom, "information_gain": q.information_gain}
                for q in predictor.follow_up_questions(result.symptom_vector)
            ],
            "unknown_symptoms":    result.unknown_symptoms,
            "model":               predictor.model_name,
        },
    }


def get_all_symptoms() -> list[str]:
    return Predictor.get().feature_columns


def list_diseases() -> list[dict]:
    """Every disease the model knows, with its specialist and base urgency."""
    return [
        {
            "name":       name,
            "specialist": SPECIALIST_MAP.get(name, "Médecin généraliste"),
            "urgency":    URGENCY_RULES.get(name, "low"),
        }
        for name in Predictor.get().classes
    ]


_text_parser: Optional[SymptomTextParser] = None


def extract_symptoms(text: str) -> dict:
    """Free-text description (English or French) -> known symptom names."""
    global _text_parser
    if _text_parser is None:
        _text_parser = SymptomTextParser(get_all_symptoms())
    result = _text_parser.parse(text)
    return {"symptoms": result.symptoms, "negated": result.negated, "matches": result.matches}
