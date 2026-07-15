"""
Generate synthetic symptom-disease training data based on medical correlations.
Run: python -m ml.src.data_generator
"""
import numpy as np
import pandas as pd
from pathlib import Path

SYMPTOMS = [
    "fever", "cough", "headache", "fatigue", "shortness_of_breath",
    "chest_pain", "nausea", "vomiting", "diarrhea", "abdominal_pain",
    "sore_throat", "runny_nose", "muscle_pain", "joint_pain", "skin_rash",
    "dizziness", "back_pain", "loss_of_appetite", "sweating", "chills",
]

# Each disease maps symptoms to probability of appearing in a patient
# (primary: 0.75–0.95, secondary: 0.20–0.50, rare: 0.05)
DISEASE_PROFILES: dict[str, dict[str, float]] = {
    "Influenza": {
        "fever": 0.92, "cough": 0.85, "fatigue": 0.88, "muscle_pain": 0.82,
        "headache": 0.75, "chills": 0.78, "sore_throat": 0.55,
        "runny_nose": 0.40, "loss_of_appetite": 0.35,
    },
    "Common Cold": {
        "runny_nose": 0.92, "sore_throat": 0.85, "cough": 0.78,
        "fatigue": 0.60, "headache": 0.45, "fever": 0.25, "chills": 0.20,
    },
    "COVID-19": {
        "fever": 0.88, "cough": 0.82, "fatigue": 0.90, "shortness_of_breath": 0.65,
        "loss_of_appetite": 0.70, "muscle_pain": 0.60, "headache": 0.55,
        "sore_throat": 0.40, "diarrhea": 0.30,
    },
    "Pneumonia": {
        "fever": 0.90, "cough": 0.92, "shortness_of_breath": 0.88,
        "chest_pain": 0.70, "fatigue": 0.85, "chills": 0.75,
        "sweating": 0.55, "loss_of_appetite": 0.45,
    },
    "Gastroenteritis": {
        "nausea": 0.92, "vomiting": 0.88, "diarrhea": 0.90,
        "abdominal_pain": 0.85, "fever": 0.60, "fatigue": 0.55,
        "loss_of_appetite": 0.70,
    },
    "Migraine": {
        "headache": 0.98, "nausea": 0.75, "dizziness": 0.65,
        "vomiting": 0.45, "fatigue": 0.50,
    },
    "Hypertension": {
        "headache": 0.72, "dizziness": 0.68, "chest_pain": 0.45,
        "fatigue": 0.40, "shortness_of_breath": 0.35,
    },
    "Appendicitis": {
        "abdominal_pain": 0.97, "fever": 0.82, "nausea": 0.78,
        "vomiting": 0.65, "loss_of_appetite": 0.75, "fatigue": 0.50,
    },
    "Urinary Tract Infection": {
        "abdominal_pain": 0.80, "fever": 0.70, "fatigue": 0.65,
        "nausea": 0.40, "back_pain": 0.60,
    },
    "Allergic Rhinitis": {
        "runny_nose": 0.95, "sore_throat": 0.70, "fatigue": 0.55,
        "headache": 0.40, "cough": 0.45,
    },
    "Dengue Fever": {
        "fever": 0.97, "headache": 0.88, "muscle_pain": 0.85,
        "joint_pain": 0.88, "skin_rash": 0.75, "fatigue": 0.90,
        "chills": 0.65, "nausea": 0.55, "vomiting": 0.40,
    },
    "Malaria": {
        "fever": 0.97, "chills": 0.92, "sweating": 0.88,
        "headache": 0.82, "fatigue": 0.85, "nausea": 0.65,
        "muscle_pain": 0.55, "vomiting": 0.45,
    },
    "Diabetes": {
        "fatigue": 0.88, "loss_of_appetite": 0.60, "dizziness": 0.55,
        "headache": 0.45, "back_pain": 0.35,
    },
    "Anemia": {
        "fatigue": 0.92, "dizziness": 0.80, "headache": 0.70,
        "loss_of_appetite": 0.55, "shortness_of_breath": 0.50,
    },
    "Bronchitis": {
        "cough": 0.95, "fatigue": 0.80, "chest_pain": 0.65,
        "shortness_of_breath": 0.60, "fever": 0.55, "sore_throat": 0.50,
        "headache": 0.35,
    },
}

SAMPLES_PER_DISEASE = 500
NOISE_PROB = 0.05  # random symptom noise


def generate(seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []

    for disease, profile in DISEASE_PROFILES.items():
        for _ in range(SAMPLES_PER_DISEASE):
            row = {}
            for symptom in SYMPTOMS:
                prob = profile.get(symptom, NOISE_PROB)
                row[symptom] = int(rng.random() < prob)
            row["disease"] = disease
            rows.append(row)

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    return df


if __name__ == "__main__":
    out = Path(__file__).parent.parent / "data" / "processed" / "training_data.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    df = generate()
    df.to_csv(out, index=False)
    print(f"Generated {len(df)} rows → {out}")
    print(df["disease"].value_counts())
