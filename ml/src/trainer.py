"""
Train the disease classifier on the deduplicated dataset (132 symptoms, 41 diseases).
Run: python -m ml.src.trainer

Evaluation is honest:
  - duplicates are removed before splitting, so no test profile is seen in training
  - test inputs are *partial* symptom lists (1–8 symptoms), like real patients enter
  - two candidate models are compared with 5-fold CV; the best one is kept
  - probabilities are calibrated with temperature scaling fitted on out-of-fold data
"""
import json
import time

import joblib
import numpy as np
from pathlib import Path
from scipy.optimize import minimize_scalar
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, log_loss
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

from ml.src.dataset import augment_partial, load_unique, symptom_given_disease

MODELS_DIR    = Path(__file__).parent.parent / "models" / "saved"
MODEL_PATH    = MODELS_DIR / "model.joblib"
ENCODER_PATH  = MODELS_DIR / "label_encoder.joblib"
FEATURES_PATH = MODELS_DIR / "feature_columns.joblib"
META_PATH     = MODELS_DIR / "model_meta.joblib"
REPORT_PATH   = MODELS_DIR / "training_report.json"

SEED            = 42
N_FOLDS         = 5
TRAIN_AUGMENT   = 30   # partial-symptom samples generated per training profile
TEST_AUGMENT    = 20   # partial-symptom samples generated per held-out profile
SYMPTOM_BUCKETS = [(1, 1), (2, 2), (3, 3), (4, 5), (6, 8)]


def make_candidates() -> dict:
    return {
        "xgboost": lambda: XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.1,
            subsample=0.8, colsample_bytree=0.8, min_child_weight=1,
            tree_method="hist", eval_metric="mlogloss",
            random_state=SEED, n_jobs=-1, verbosity=0,
        ),
        "logistic_regression": lambda: LogisticRegression(C=3.0, max_iter=2000),
    }


# ── Calibration ─────────────────────────────────────────────────────

def apply_temperature(probas: np.ndarray, temperature: float) -> np.ndarray:
    """softmax(logits / T), computed from probabilities (log p differs from logits by a constant)."""
    logits = np.log(np.clip(probas, 1e-12, 1.0)) / temperature
    logits -= logits.max(axis=1, keepdims=True)
    exp = np.exp(logits)
    return exp / exp.sum(axis=1, keepdims=True)


def fit_temperature(probas: np.ndarray, y: np.ndarray) -> float:
    def nll(log_t: float) -> float:
        p = apply_temperature(probas, np.exp(log_t))
        return -np.mean(np.log(np.clip(p[np.arange(len(y)), y], 1e-12, 1.0)))
    res = minimize_scalar(nll, bounds=(np.log(0.05), np.log(20.0)), method="bounded")
    return float(np.exp(res.x))


# ── Metrics ─────────────────────────────────────────────────────────

def top_k_accuracy(probas: np.ndarray, y: np.ndarray, k: int) -> float:
    top = np.argsort(probas, axis=1)[:, ::-1][:, :k]
    return float(np.mean([y[i] in top[i] for i in range(len(y))]))


def expected_calibration_error(probas: np.ndarray, y: np.ndarray, n_bins: int = 10) -> float:
    """Gap between stated confidence and actual accuracy of the top prediction."""
    conf = probas.max(axis=1)
    correct = probas.argmax(axis=1) == y
    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for lo, hi in zip(bins[:-1], bins[1:]):
        mask = (conf > lo) & (conf <= hi)
        if mask.any():
            ece += mask.mean() * abs(conf[mask].mean() - correct[mask].mean())
    return float(ece)


def evaluate(probas: np.ndarray, y: np.ndarray, n_symptoms: np.ndarray, n_classes: int) -> dict:
    by_count = {}
    for lo, hi in SYMPTOM_BUCKETS:
        mask = (n_symptoms >= lo) & (n_symptoms <= hi)
        label = str(lo) if lo == hi else f"{lo}-{hi}"
        by_count[label] = {
            "top1": top_k_accuracy(probas[mask], y[mask], 1),
            "top3": top_k_accuracy(probas[mask], y[mask], 3),
            "n":    int(mask.sum()),
        }
    return {
        "top1_accuracy": top_k_accuracy(probas, y, 1),
        "top3_accuracy": top_k_accuracy(probas, y, 3),
        "macro_f1":      float(f1_score(y, probas.argmax(axis=1), average="macro")),
        "log_loss":      float(log_loss(y, probas, labels=np.arange(n_classes))),
        "ece":           expected_calibration_error(probas, y),
        "by_symptom_count": by_count,
    }


# ── Training ────────────────────────────────────────────────────────

def cross_validate(name, factory, X, y, n_classes) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Out-of-fold probabilities on partial-symptom test samples."""
    folds = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=SEED)
    oof_p, oof_y, oof_n = [], [], []
    for fold, (tr, te) in enumerate(folds.split(X, y), 1):
        rng = np.random.default_rng(SEED + fold)
        X_tr, y_tr = augment_partial(X[tr], y[tr], TRAIN_AUGMENT, rng)
        X_te, y_te = augment_partial(X[te], y[te], TEST_AUGMENT, rng)
        model = factory()
        model.fit(X_tr, y_tr)
        oof_p.append(model.predict_proba(X_te))
        oof_y.append(y_te)
        oof_n.append(X_te.sum(axis=1))
        print(f"  [{name}] fold {fold}/{N_FOLDS} done")
    return np.vstack(oof_p), np.concatenate(oof_y), np.concatenate(oof_n)


def train() -> dict:
    print("=" * 60)
    print("AI Medical Assistant — model training")
    print("=" * 60)

    X, y_raw, feature_cols = load_unique()
    encoder = LabelEncoder()
    y = encoder.fit_transform(y_raw)
    n_classes = len(encoder.classes_)
    print(f"\nUnique profiles: {len(X)} | features: {len(feature_cols)} | diseases: {n_classes}\n")

    results = {}
    for name, factory in make_candidates().items():
        start = time.time()
        probas, y_te, n_sym = cross_validate(name, factory, X, y, n_classes)
        temperature = fit_temperature(probas, y_te)
        calibrated = apply_temperature(probas, temperature)
        results[name] = {
            "temperature": temperature,
            "raw":         evaluate(probas, y_te, n_sym, n_classes),
            "calibrated":  evaluate(calibrated, y_te, n_sym, n_classes),
            "seconds":     round(time.time() - start, 1),
        }
        c = results[name]["calibrated"]
        print(f"  [{name}] top1={c['top1_accuracy']:.3f} top3={c['top3_accuracy']:.3f} "
              f"logloss={c['log_loss']:.3f} ECE={c['ece']:.3f} T={temperature:.2f}\n")

    best = min(results, key=lambda n: results[n]["calibrated"]["log_loss"])
    print(f"Selected model: {best}\n")

    # Final fit on every profile
    rng = np.random.default_rng(SEED)
    X_all, y_all = augment_partial(X, y, TRAIN_AUGMENT, rng)
    model = make_candidates()[best]()
    model.fit(X_all, y_all)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model,        MODEL_PATH)
    joblib.dump(encoder,      ENCODER_PATH)
    joblib.dump(feature_cols, FEATURES_PATH)
    joblib.dump({
        "model_name":   best,
        "temperature":  results[best]["temperature"],
        "symptom_given_disease": symptom_given_disease(X, y, n_classes),
        "trained_at":   time.strftime("%Y-%m-%dT%H:%M:%S"),
    }, META_PATH)

    report = {
        "selected_model":    best,
        "evaluation":        "5-fold CV on deduplicated profiles, tested on partial symptom lists",
        "n_unique_profiles": int(len(X)),
        "n_diseases":        n_classes,
        "n_features":        len(feature_cols),
        "diseases":          list(encoder.classes_),
        "candidates":        results,
        **{k: results[best]["calibrated"][k] for k in ("top1_accuracy", "top3_accuracy", "macro_f1", "ece")},
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False))

    print("Accuracy by number of symptoms entered (calibrated, out-of-fold):")
    for bucket, m in results[best]["calibrated"]["by_symptom_count"].items():
        print(f"  {bucket:>4} symptoms: top1={m['top1']:.3f}  top3={m['top3']:.3f}  (n={m['n']})")
    print(f"\nSaved model, encoder, features, meta and report to {MODELS_DIR}")
    return report


if __name__ == "__main__":
    r = train()
    print(f"\nDone. top1={r['top1_accuracy']:.3f} | top3={r['top3_accuracy']:.3f} | ECE={r['ece']:.3f}")
