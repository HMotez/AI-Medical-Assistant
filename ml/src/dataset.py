"""
Load and clean the disease-symptom dataset (132 symptoms, 41 diseases).

The raw CSV has three problems this module fixes:
  - each unique row is repeated ~16x (4920 rows, only 304 unique) — deduplicated here
  - messy column names ("spotting_ urination", duplicated "fluid_overload")
  - misspelled disease names ("Osteoarthristis", "Peptic ulcer diseae")

Uses the stdlib csv module + numpy only (no pandas).
"""
import csv
import re
from pathlib import Path

import numpy as np

DATA_PATH  = Path(__file__).parent.parent / "data" / "processed" / "training_data.csv"
TARGET_COL = "prognosis"

DISEASE_NAME_FIXES = {
    "Osteoarthristis":                         "Osteoarthritis",
    "Peptic ulcer diseae":                     "Peptic ulcer disease",
    "(vertigo) Paroymsal  Positional Vertigo": "Paroxysmal Positional Vertigo",
    "Dimorphic hemmorhoids(piles)":            "Hemorrhoids (piles)",
    "hepatitis A":                             "Hepatitis A",
    "Urinary tract infection":                 "Urinary Tract Infection",
}


def normalize_symptom(name: str) -> str:
    """'Spotting_ urination ' -> 'spotting_urination'."""
    name = re.sub(r"[\s_]+", "_", name.strip().lower())
    return name.strip("_")


def normalize_disease(name: str) -> str:
    name = name.strip()
    return DISEASE_NAME_FIXES.get(name, name)


def load_unique() -> tuple[np.ndarray, np.ndarray, list[str]]:
    """
    Return (X, y, feature_cols) with duplicate rows removed.
    X is an int8 binary matrix, y an array of disease names.
    """
    with open(DATA_PATH, encoding="utf-8", newline="") as f:
        rows = list(csv.reader(f))

    header = rows[0]
    target_idx = header.index(TARGET_COL)

    # Keep the first occurrence of each normalized, non-empty symptom column
    feature_idx, feature_cols = [], []
    for i, col in enumerate(header):
        name = normalize_symptom(col)
        if i == target_idx or not name or name.startswith("unnamed") or name in feature_cols:
            continue
        feature_idx.append(i)
        feature_cols.append(name)

    seen, X, y = set(), [], []
    for row in rows[1:]:
        if len(row) <= target_idx or not row[target_idx].strip():
            continue
        vec = tuple(int(float(row[i] or 0)) for i in feature_idx)
        label = normalize_disease(row[target_idx])
        if (vec, label) in seen:
            continue
        seen.add((vec, label))
        X.append(vec)
        y.append(label)

    return np.array(X, dtype=np.int8), np.array(y), feature_cols


def augment_partial(
    X: np.ndarray,
    y: np.ndarray,
    n_per_row: int,
    rng: np.random.Generator,
    max_symptoms: int = 8,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Simulate real patients, who report only some of a disease's symptoms.
    For each full profile, draw `n_per_row` random subsets of 1..max_symptoms
    active symptoms; the full profile itself is kept too.
    """
    X_out, y_out = [X], [y]
    for vec, label in zip(X, y):
        active = np.flatnonzero(vec)
        upper = min(len(active), max_symptoms)
        for _ in range(n_per_row):
            k = rng.integers(1, upper + 1)
            keep = rng.choice(active, size=k, replace=False)
            sub = np.zeros_like(vec)
            sub[keep] = 1
            X_out.append(sub[None, :])
            y_out.append(np.array([label]))
    return np.vstack(X_out), np.concatenate(y_out)


def symptom_given_disease(X: np.ndarray, y_idx: np.ndarray, n_classes: int) -> np.ndarray:
    """
    P(symptom | disease) table, shape (n_classes, n_features), Laplace-smoothed.
    Used to choose informative follow-up questions.
    """
    table = np.zeros((n_classes, X.shape[1]))
    for c in range(n_classes):
        rows = X[y_idx == c]
        table[c] = (rows.sum(axis=0) + 0.5) / (len(rows) + 1.0)
    return table
