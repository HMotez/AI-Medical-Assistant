"""
Lightweight per-prediction explanation using leave-one-out attribution.
No SHAP/numba/llvmlite needed — works with XGBoost's predict_proba directly.

For each symptom the patient reported, we measure how much the confidence
of the top prediction drops when that symptom is removed. The bigger the drop,
the more influential the symptom.
"""
import numpy as np
import joblib
from pathlib import Path

MODELS_DIR    = Path(__file__).parent.parent / "models" / "saved"
MODEL_PATH    = MODELS_DIR / "model.joblib"
FEATURES_PATH = MODELS_DIR / "feature_columns.joblib"


class Explainer:
    def __init__(self):
        self._model        = joblib.load(MODEL_PATH)
        self._feature_cols = joblib.load(FEATURES_PATH)

    def explain(
        self,
        symptom_vector: list[int],
        class_index: int,
        top_n: int = 8,
    ) -> dict[str, float]:
        """
        Return {symptom_name: contribution_score} for the top predicted disease.
        Contribution = drop in confidence when that symptom is removed.
        Positive value → symptom supports this diagnosis.
        """
        x_base = np.array(symptom_vector, dtype=float).reshape(1, -1)
        base_proba = float(self._model.predict_proba(x_base)[0][class_index])

        active_indices = [i for i, v in enumerate(symptom_vector) if v == 1]
        contributions: dict[str, float] = {}

        for idx in active_indices:
            x_loo = x_base.copy()
            x_loo[0, idx] = 0  # remove this symptom
            loo_proba = float(self._model.predict_proba(x_loo)[0][class_index])
            drop = base_proba - loo_proba  # positive → symptom was helping
            contributions[self._feature_cols[idx]] = round(drop, 4)

        # Return top_n sorted by absolute contribution
        top = sorted(contributions.items(), key=lambda kv: abs(kv[1]), reverse=True)[:top_n]
        return dict(top)
