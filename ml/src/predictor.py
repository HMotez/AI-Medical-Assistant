"""
Main prediction service — loaded once at FastAPI startup.
"""
import joblib
import numpy as np
from pathlib import Path
from dataclasses import dataclass

from ml.src.dataset import normalize_symptom

MODELS_DIR    = Path(__file__).parent.parent / "models" / "saved"
MODEL_PATH    = MODELS_DIR / "model.joblib"
ENCODER_PATH  = MODELS_DIR / "label_encoder.joblib"
FEATURES_PATH = MODELS_DIR / "feature_columns.joblib"
META_PATH     = MODELS_DIR / "model_meta.joblib"

# Below this top-1 confidence the result is flagged as uncertain
UNCERTAIN_CONFIDENCE = 0.5


@dataclass
class DiseasePrediction:
    disease: str
    confidence: float   # 0.0 – 1.0, calibrated
    rank: int


@dataclass
class FollowUpQuestion:
    symptom: str
    information_gain: float   # expected reduction in uncertainty (bits)


@dataclass
class PredictionResult:
    top_predictions: list[DiseasePrediction]
    symptom_vector: list[int]
    top_class_index: int
    is_uncertain: bool
    unknown_symptoms: list[str]


class Predictor:
    _instance: "Predictor | None" = None

    def __init__(self):
        self._model        = joblib.load(MODEL_PATH)
        self._encoder      = joblib.load(ENCODER_PATH)
        self._feature_cols = joblib.load(FEATURES_PATH)
        meta = joblib.load(META_PATH) if META_PATH.exists() else {}
        self._temperature  = meta.get("temperature", 1.0)
        self._p_symptom    = meta.get("symptom_given_disease")   # (n_classes, n_features)
        self.model_name    = meta.get("model_name", "unknown")
        self._index        = {name: i for i, name in enumerate(self._feature_cols)}

    @classmethod
    def get(cls) -> "Predictor":
        """Singleton — loaded once at startup."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def feature_columns(self) -> list[str]:
        return self._feature_cols

    @property
    def classes(self) -> list[str]:
        return list(self._encoder.classes_)

    def build_vector(self, symptom_names: list[str]) -> list[int]:
        """Convert a list of symptom names to a binary feature vector."""
        symptom_set = {normalize_symptom(s) for s in symptom_names}
        return [1 if col in symptom_set else 0 for col in self._feature_cols]

    def predict_proba(self, vector: list[int]) -> np.ndarray:
        """Calibrated class probabilities for one symptom vector."""
        x = np.array(vector, dtype=float).reshape(1, -1)
        raw = self._model.predict_proba(x)[0]
        logits = np.log(np.clip(raw, 1e-12, 1.0)) / self._temperature
        exp = np.exp(logits - logits.max())
        return exp / exp.sum()

    def predict(self, symptom_names: list[str], top_n: int = 5) -> PredictionResult:
        vector = self.build_vector(symptom_names)
        probas = self.predict_proba(vector)
        top_indices = np.argsort(probas)[::-1][:top_n]

        predictions = [
            DiseasePrediction(
                disease=str(self._encoder.classes_[i]),
                confidence=float(probas[i]),
                rank=rank + 1,
            )
            for rank, i in enumerate(top_indices)
        ]

        return PredictionResult(
            top_predictions=predictions,
            symptom_vector=vector,
            top_class_index=int(top_indices[0]),
            is_uncertain=bool(probas[top_indices[0]] < UNCERTAIN_CONFIDENCE),
            unknown_symptoms=[s for s in symptom_names if normalize_symptom(s) not in self._index],
        )

    def follow_up_questions(self, symptom_vector: list[int], n: int = 3) -> list[FollowUpQuestion]:
        """
        Symptoms not yet reported whose answer (yes/no) would best separate
        the current candidate diseases — ranked by expected information gain.
        """
        if self._p_symptom is None:
            return []

        prior = self.predict_proba(symptom_vector)
        prior_entropy = _entropy(prior)
        reported = np.array(symptom_vector, dtype=bool)

        # P(symptom present) under current beliefs, for every symptom at once
        p_yes = prior @ self._p_symptom                                    # (n_features,)
        post_yes = prior[:, None] * self._p_symptom                        # (n_classes, n_features)
        post_no  = prior[:, None] * (1 - self._p_symptom)
        post_yes /= post_yes.sum(axis=0, keepdims=True)
        post_no  /= post_no.sum(axis=0, keepdims=True)
        expected = p_yes * _entropy(post_yes, axis=0) + (1 - p_yes) * _entropy(post_no, axis=0)
        gain = prior_entropy - expected
        gain[reported] = -np.inf

        best = np.argsort(gain)[::-1][:n]
        return [
            FollowUpQuestion(symptom=self._feature_cols[i], information_gain=round(float(gain[i]), 4))
            for i in best if gain[i] > 0.01
        ]


def _entropy(p: np.ndarray, axis: int = -1) -> np.ndarray:
    p = np.clip(p, 1e-12, 1.0)
    return -(p * np.log2(p)).sum(axis=axis)
