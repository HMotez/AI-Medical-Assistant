"""
Train XGBoost classifier on the real disease-symptom dataset (132 symptoms, 41 diseases).
Run: python -m ml.src.trainer
"""
import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from xgboost import XGBClassifier

MODELS_DIR    = Path(__file__).parent.parent / "models" / "saved"
DATA_PATH     = Path(__file__).parent.parent / "data" / "processed" / "training_data.csv"
MODEL_PATH    = MODELS_DIR / "model.joblib"
ENCODER_PATH  = MODELS_DIR / "label_encoder.joblib"
FEATURES_PATH = MODELS_DIR / "feature_columns.joblib"
REPORT_PATH   = MODELS_DIR / "training_report.json"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
TARGET_COL = "prognosis"


def load_data() -> tuple[pd.DataFrame, list[str]]:
    df = pd.read_csv(DATA_PATH)
    # Normalise column names: strip whitespace, collapse internal spaces to underscore
    df.columns = [c.strip().replace(" ", "_") for c in df.columns]
    # Drop unnamed / empty columns
    df = df.loc[:, ~df.columns.str.startswith("Unnamed")]
    df = df.loc[:, df.columns != ""]
    # Drop duplicate columns (fluid_overload appears twice in the raw CSV)
    df = df.loc[:, ~df.columns.duplicated()]
    # Strip whitespace in the target column
    df[TARGET_COL] = df[TARGET_COL].str.strip()
    feature_cols = [c for c in df.columns if c != TARGET_COL]
    return df, feature_cols


def train() -> dict:
    print("=" * 60)
    print("AI Medical Assistant — XGBoost Training")
    print("=" * 60)

    df, feature_cols = load_data()
    print(f"\nDataset: {len(df)} rows, {len(feature_cols)} features, {df[TARGET_COL].nunique()} diseases")
    print(f"Diseases: {sorted(df[TARGET_COL].unique())}\n")

    X = df[feature_cols].fillna(0).astype(int).values
    y_raw = df[TARGET_COL].values

    encoder = LabelEncoder()
    y = encoder.fit_transform(y_raw)

    # 80/20 stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {len(X_train)} samples | Test: {len(X_test)} samples\n")

    # XGBoost with tuned hyperparameters for this dataset
    model = XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        eval_metric="mlogloss",
        early_stopping_rounds=30,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )

    print("Training XGBoost...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    # Test set evaluation
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=encoder.classes_, output_dict=True)

    print(f"\n{'=' * 60}")
    print(f"Test Accuracy : {acc:.4f} ({acc*100:.2f}%)")
    print(f"Best iteration: {model.best_iteration}")
    print(f"{'=' * 60}\n")
    print(classification_report(y_test, y_pred, target_names=encoder.classes_))

    # 5-fold cross-validation on full dataset for robust estimate
    print("Running 5-fold cross-validation...")
    cv_scores = cross_val_score(
        XGBClassifier(
            n_estimators=model.best_iteration or 300,
            max_depth=6, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8,
            eval_metric="mlogloss", random_state=42, n_jobs=-1, verbosity=0,
        ),
        X, y, cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
        scoring="accuracy", n_jobs=-1,
    )
    print(f"CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}\n")

    # Save artefacts FIRST (before any display that could crash)
    joblib.dump(model,        MODEL_PATH)
    joblib.dump(encoder,      ENCODER_PATH)
    joblib.dump(feature_cols, FEATURES_PATH)

    # Top-20 most important features
    importances = model.feature_importances_
    top_features = sorted(
        zip(feature_cols, importances),
        key=lambda x: x[1], reverse=True
    )[:20]
    print("Top 20 most discriminative symptoms:")
    for sym, imp in top_features:
        bar = "#" * int(imp * 100)
        print(f"  {sym:<45} {bar} {imp:.4f}")

    training_report = {
        "accuracy":          float(acc),
        "cv_mean":           float(cv_scores.mean()),
        "cv_std":            float(cv_scores.std()),
        "best_iteration":    int(model.best_iteration or 0),
        "n_diseases":        int(len(encoder.classes_)),
        "n_features":        int(len(feature_cols)),
        "diseases":          list(encoder.classes_),
        "top_features":      [{"symptom": s, "importance": float(v)} for s, v in top_features],
        "classification_report": report,
    }
    REPORT_PATH.write_text(json.dumps(training_report, indent=2, ensure_ascii=False))

    print(f"\nModel    : {MODEL_PATH}")
    print(f"Encoder  : {ENCODER_PATH}")
    print(f"Features : {FEATURES_PATH}")
    print(f"Report   : {REPORT_PATH}")
    return training_report


if __name__ == "__main__":
    result = train()
    print(f"\nDone. Accuracy={result['accuracy']:.4f} | CV={result['cv_mean']:.4f}±{result['cv_std']:.4f}")
