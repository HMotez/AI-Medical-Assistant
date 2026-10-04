"""
Lightweight per-prediction explanation using leave-one-out attribution.
No SHAP/numba/llvmlite needed — works with any model behind the Predictor.

For each symptom the patient reported, we measure how much the confidence
of the top prediction drops when that symptom is removed. The bigger the drop,
the more influential the symptom.
"""
from ml.src.predictor import Predictor


class Explainer:
    def __init__(self, predictor: Predictor):
        self._predictor = predictor

    def explain(
        self,
        symptom_vector: list[int],
        class_index: int,
        top_n: int = 8,
    ) -> dict[str, float]:
        """
        Return {symptom_name: contribution_score} for the top predicted disease.
        Contribution = drop in calibrated confidence when that symptom is removed.
        Positive value → symptom supports this diagnosis.
        """
        base_proba = float(self._predictor.predict_proba(symptom_vector)[class_index])
        features = self._predictor.feature_columns
        contributions: dict[str, float] = {}

        for idx, active in enumerate(symptom_vector):
            if not active:
                continue
            loo = list(symptom_vector)
            loo[idx] = 0  # remove this symptom
            loo_proba = float(self._predictor.predict_proba(loo)[class_index])
            contributions[features[idx]] = round(base_proba - loo_proba, 4)

        # Return top_n sorted by absolute contribution
        top = sorted(contributions.items(), key=lambda kv: abs(kv[1]), reverse=True)[:top_n]
        return dict(top)
