"""
Main prediction service — loaded once at FastAPI startup.
"""
import joblib
import numpy as np
from pathlib import Path
from dataclasses import dataclass

MODELS_DIR    = Path(__file__).parent.parent / "models" / "saved"
MODEL_PATH    = MODELS_DIR / "model.joblib"
ENCODER_PATH  = MODELS_DIR / "label_encoder.joblib"
FEATURES_PATH = MODELS_DIR / "feature_columns.joblib"


@dataclass
class DiseasePrediction:
    disease: str
    confidence: float   # 0.0 – 1.0
    rank: int


@dataclass
class PredictionResult:
    top_predictions: list[DiseasePrediction]
    symptom_vector: list[int]
    top_class_index: int       # index used for SHAP


class Predictor:
    _instance: "Predictor | None" = None

    def __init__(self):
        self._model        = joblib.load(MODEL_PATH)
        self._encoder      = joblib.load(ENCODER_PATH)
        self._feature_cols = joblib.load(FEATURES_PATH)

    @classmethod
    def get(cls) -> "Predictor":
        """Singleton — loaded once at startup."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def feature_columns(self) -> list[str]:
        return self._feature_cols

    def build_vector(self, symptom_names: list[str]) -> list[int]:
        """Convert a list of symptom names to a binary feature vector."""
        symptom_set = set(s.lower().replace(" ", "_") for s in symptom_names)
        return [1 if col in symptom_set else 0 for col in self._feature_cols]

    def predict(self, symptom_names: list[str], top_n: int = 5) -> PredictionResult:
        vector = self.build_vector(symptom_names)
        x = np.array(vector).reshape(1, -1)

        probas = self._model.predict_proba(x)[0]
        top_indices = np.argsort(probas)[::-1][:top_n]

        predictions = [
            DiseasePrediction(
                disease=self._encoder.classes_[i],
                confidence=float(probas[i]),
                rank=rank + 1,
            )
            for rank, i in enumerate(top_indices)
        ]

        return PredictionResult(
            top_predictions=predictions,
            symptom_vector=vector,
            top_class_index=int(top_indices[0]),
        )
