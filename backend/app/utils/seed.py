"""Run once to populate symptoms and diseases from the real dataset."""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.symptom import Symptom
from app.models.disease import Disease

# 132 symptoms from the Kaggle/GitHub dataset
SYMPTOMS = [
    "itching", "skin_rash", "nodal_skin_eruptions", "continuous_sneezing", "shivering",
    "chills", "joint_pain", "stomach_pain", "acidity", "ulcers_on_tongue", "muscle_wasting",
    "vomiting", "burning_micturition", "spotting_urination", "fatigue", "weight_gain",
    "anxiety", "cold_hands_and_feets", "mood_swings", "weight_loss", "restlessness",
    "lethargy", "patches_in_throat", "irregular_sugar_level", "cough", "high_fever",
    "sunken_eyes", "breathlessness", "sweating", "dehydration", "indigestion", "headache",
    "yellowish_skin", "dark_urine", "nausea", "loss_of_appetite", "pain_behind_the_eyes",
    "back_pain", "constipation", "abdominal_pain", "diarrhoea", "mild_fever", "yellow_urine",
    "yellowing_of_eyes", "acute_liver_failure", "fluid_overload", "swelling_of_stomach",
    "swelled_lymph_nodes", "malaise", "blurred_and_distorted_vision", "phlegm",
    "throat_irritation", "redness_of_eyes", "sinus_pressure", "runny_nose", "congestion",
    "chest_pain", "weakness_in_limbs", "fast_heart_rate", "pain_during_bowel_movements",
    "pain_in_anal_region", "bloody_stool", "irritation_in_anus", "neck_pain", "dizziness",
    "cramps", "bruising", "obesity", "swollen_legs", "swollen_blood_vessels",
    "puffy_face_and_eyes", "enlarged_thyroid", "brittle_nails", "swollen_extremeties",
    "excessive_hunger", "extra_marital_contacts", "drying_and_tingling_lips", "slurred_speech",
    "knee_pain", "hip_joint_pain", "muscle_weakness", "stiff_neck", "swelling_joints",
    "movement_stiffness", "spinning_movements", "loss_of_balance", "unsteadiness",
    "weakness_of_one_body_side", "loss_of_smell", "bladder_discomfort", "foul_smell_of_urine",
    "continuous_feel_of_urine", "passage_of_gases", "internal_itching", "toxic_look_(typhos)",
    "depression", "irritability", "muscle_pain", "altered_sensorium", "red_spots_over_body",
    "belly_pain", "abnormal_menstruation", "dischromic_patches", "watering_from_eyes",
    "increased_appetite", "polyuria", "family_history", "mucoid_sputum", "rusty_sputum",
    "lack_of_concentration", "visual_disturbances", "receiving_blood_transfusion",
    "receiving_unsterile_injections", "coma", "stomach_bleeding", "distention_of_abdomen",
    "history_of_alcohol_consumption", "blood_in_sputum", "prominent_veins_on_calf",
    "palpitations", "painful_walking", "pus_filled_pimples", "blackheads", "scurring",
    "skin_peeling", "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails",
    "blister", "red_sore_around_nose", "yellow_crust_ooze",
]

DISEASES = [
    {"name": "Fungal infection",         "specialist": "Dermatologue"},
    {"name": "Allergy",                  "specialist": "Allergologue"},
    {"name": "GERD",                     "specialist": "Gastro-entérologue"},
    {"name": "Chronic cholestasis",      "specialist": "Gastro-entérologue"},
    {"name": "Drug Reaction",            "specialist": "Interniste"},
    {"name": "Peptic ulcer disease",     "specialist": "Gastro-entérologue"},
    {"name": "AIDS",                     "specialist": "Infectiologue"},
    {"name": "Diabetes",                 "specialist": "Endocrinologue"},
    {"name": "Gastroenteritis",          "specialist": "Gastro-entérologue"},
    {"name": "Bronchial Asthma",         "specialist": "Pneumologue"},
    {"name": "Hypertension",             "specialist": "Cardiologue"},
    {"name": "Migraine",                 "specialist": "Neurologue"},
    {"name": "Cervical spondylosis",     "specialist": "Rhumatologue"},
    {"name": "Paralysis (brain hemorrhage)", "specialist": "Neurologue"},
    {"name": "Jaundice",                 "specialist": "Gastro-entérologue"},
    {"name": "Malaria",                  "specialist": "Infectiologue"},
    {"name": "Chicken pox",              "specialist": "Infectiologue"},
    {"name": "Dengue",                   "specialist": "Infectiologue"},
    {"name": "Typhoid",                  "specialist": "Infectiologue"},
    {"name": "hepatitis A",              "specialist": "Gastro-entérologue"},
    {"name": "Hepatitis B",              "specialist": "Hépatologue"},
    {"name": "Hepatitis C",              "specialist": "Hépatologue"},
    {"name": "Hepatitis D",              "specialist": "Hépatologue"},
    {"name": "Hepatitis E",              "specialist": "Hépatologue"},
    {"name": "Alcoholic hepatitis",      "specialist": "Hépatologue"},
    {"name": "Tuberculosis",             "specialist": "Pneumologue"},
    {"name": "Common Cold",              "specialist": "Médecin généraliste"},
    {"name": "Pneumonia",                "specialist": "Pneumologue"},
    {"name": "Dimorphic hemmorhoids(piles)", "specialist": "Chirurgien"},
    {"name": "Heart attack",             "specialist": "Cardiologue"},
    {"name": "Varicose veins",           "specialist": "Cardiologue"},
    {"name": "Hypothyroidism",           "specialist": "Endocrinologue"},
    {"name": "Hyperthyroidism",          "specialist": "Endocrinologue"},
    {"name": "Hypoglycemia",             "specialist": "Endocrinologue"},
    {"name": "Osteoarthritis",           "specialist": "Rhumatologue"},
    {"name": "Arthritis",                "specialist": "Rhumatologue"},
    {"name": "(vertigo) Paroymsal  Positional Vertigo", "specialist": "ORL"},
    {"name": "Acne",                     "specialist": "Dermatologue"},
    {"name": "Urinary tract infection",  "specialist": "Urologue"},
    {"name": "Psoriasis",                "specialist": "Dermatologue"},
    {"name": "Impetigo",                 "specialist": "Dermatologue"},
]


def seed(db: Session) -> None:
    added_symptoms = 0
    for name in SYMPTOMS:
        if not db.query(Symptom).filter_by(name=name).first():
            db.add(Symptom(name=name))
            added_symptoms += 1

    added_diseases = 0
    for d in DISEASES:
        if not db.query(Disease).filter_by(name=d["name"]).first():
            db.add(Disease(**d))
            added_diseases += 1

    db.commit()
    print(f"Seeded {added_symptoms} symptoms and {added_diseases} diseases.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
