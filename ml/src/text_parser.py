"""
Turn a patient's free-text description into the model's symptom names.

    "J'ai mal à la tête et des vertiges, pas de fièvre"
        -> symptoms: ["headache", "dizziness"], negated: ["high_fever"]

Rule-based and offline: English + French phrases, synonyms, plurals and
simple negation ("no fever", "pas de fièvre", "without cough").
"""
import re
import unicodedata
from dataclasses import dataclass, field

# Extra phrases per symptom (lowercase, accents removed). Each symptom's own
# name with spaces ("skin rash") is always matched too.
SYNONYMS: dict[str, list[str]] = {
    "itching":            ["itch", "itchy", "itchiness", "demangeaison", "ca gratte", "prurit"],
    "skin_rash":          ["rash", "rashes", "eruption cutanee", "boutons sur la peau", "plaques rouges", "rougeurs"],
    "continuous_sneezing": ["sneezing", "sneeze", "eternuement", "eternue", "j eternue"],
    "shivering":          ["shiver", "shaking", "tremblement", "je tremble", "grelotte"],
    "chills":             ["chill", "frisson", "j ai froid"],
    "joint_pain":         ["joints hurt", "aching joints", "douleur articulaire", "mal aux articulations", "arthralgie"],
    "stomach_pain":       ["stomach ache", "stomachache", "tummy ache", "mal a l estomac", "douleur a l estomac", "crampe d estomac"],
    "acidity":            ["heartburn", "acid reflux", "reflux", "brulure d estomac", "aigreur", "remontee acide"],
    "ulcers_on_tongue":   ["mouth ulcer", "tongue ulcer", "aphte", "ulcere sur la langue"],
    "muscle_wasting":     ["muscle loss", "fonte musculaire", "perte musculaire"],
    "vomiting":           ["vomit", "throwing up", "throw up", "threw up", "vomissement", "vomir", "je vomis", "j ai vomi"],
    "burning_micturition": ["burning urination", "burning when i pee", "burning when peeing", "painful urination",
                            "brulure en urinant", "brulure urinaire", "ca brule quand j urine"],
    "spotting_urination": ["blood in urine", "sang dans les urines", "urine avec du sang"],
    "fatigue":            ["tired", "tiredness", "exhausted", "exhaustion", "worn out", "fatigue", "fatigué", "epuise", "crevé", "creve"],
    "weight_gain":        ["gained weight", "putting on weight", "prise de poids", "j ai grossi"],
    "anxiety":            ["anxious", "nervous", "anxiete", "anxieux", "anxieuse", "angoisse", "stress"],
    "cold_hands_and_feets": ["cold hands", "cold feet", "mains froides", "pieds froids"],
    "mood_swings":        ["moody", "sautes d humeur", "changements d humeur"],
    "weight_loss":        ["lost weight", "losing weight", "perdu du poids", "perdu de poids", "perte de poids", "j ai maigri", "amaigrissement"],
    "restlessness":       ["restless", "agitation", "agite", "agitee"],
    "lethargy":           ["sluggish", "lethargie", "lethargique", "sans energie"],
    "patches_in_throat":  ["white patches in throat", "plaques dans la gorge", "taches dans la gorge"],
    "irregular_sugar_level": ["blood sugar", "sugar level", "glycemie", "taux de sucre"],
    "cough":              ["coughing", "toux", "tousse", "je tousse", "tousser"],
    "high_fever":         ["fever", "feverish", "high temperature", "temperature", "fievre", "forte fievre", "fievre elevee", "de la temperature"],
    "mild_fever":         ["mild fever", "slight fever", "low fever", "low grade fever", "petite fievre", "legere fievre", "fievre legere", "febricule"],
    "sunken_eyes":        ["yeux creux", "yeux enfonces"],
    "breathlessness":     ["shortness of breath", "short of breath", "out of breath", "hard to breathe", "difficulty breathing",
                           "trouble breathing", "cannot breathe", "essoufflement", "essouffle", "souffle court",
                           "du mal a respirer", "difficulte a respirer", "dyspnee"],
    "sweating":           ["sweat", "sweats", "night sweats", "transpiration", "sueur", "je transpire", "sueurs nocturnes"],
    "dehydration":        ["dehydrated", "deshydratation", "deshydrate"],
    "indigestion":        ["upset stomach", "dyspepsia", "indigestion", "digestion difficile"],
    "headache":           ["head ache", "head hurts", "migraine", "mal de tete", "maux de tete", "mal a la tete", "cephalee"],
    "yellowish_skin":     ["yellow skin", "peau jaune", "teint jaune", "jaunisse"],
    "dark_urine":         ["urine foncee", "urines foncees"],
    "nausea":             ["nauseous", "queasy", "feel sick", "feeling sick", "nausee", "envie de vomir", "mal au coeur", "ecoeure"],
    "loss_of_appetite":   ["no appetite", "not hungry", "perte d appetit", "pas d appetit", "plus d appetit", "pas faim"],
    "pain_behind_the_eyes": ["pain behind eyes", "douleur derriere les yeux", "mal derriere les yeux"],
    "back_pain":          ["backache", "back ache", "back hurts", "mal au dos", "mal de dos", "douleur au dos", "lombalgie"],
    "constipation":       ["constipated", "constipe", "constipee"],
    "abdominal_pain":     ["abdominal ache", "mal au ventre", "douleur abdominale", "douleur au ventre", "mal de ventre"],
    "diarrhoea":          ["diarrhea", "loose stools", "runny stools", "diarrhee", "selles liquides"],
    "yellow_urine":       ["urine jaune"],
    "yellowing_of_eyes":  ["yellow eyes", "yeux jaunes", "jaunissement des yeux"],
    "swelling_of_stomach": ["swollen stomach", "swollen belly", "ventre gonfle", "gonflement du ventre"],
    "swelled_lymph_nodes": ["swollen lymph nodes", "swollen glands", "ganglions gonfles", "ganglions"],
    "malaise":            ["feeling unwell", "feel unwell", "general discomfort", "malaise", "je me sens mal"],
    "blurred_and_distorted_vision": ["blurred vision", "blurry vision", "vision floue", "vue floue", "vue trouble"],
    "phlegm":             ["mucus", "glaire", "glaires", "mucosite", "crachat"],
    "throat_irritation":  ["sore throat", "throat hurts", "scratchy throat", "mal a la gorge", "mal de gorge", "gorge irritee", "angine"],
    "redness_of_eyes":    ["red eyes", "bloodshot eyes", "yeux rouges"],
    "sinus_pressure":     ["sinus pain", "sinusite", "pression des sinus", "douleur aux sinus"],
    "runny_nose":         ["running nose", "nose is running", "nose running", "nose keeps running", "nez qui coule", "ecoulement nasal", "rhume"],
    "congestion":         ["stuffy nose", "blocked nose", "nasal congestion", "nez bouche", "nez bouché", "congestion nasale"],
    "chest_pain":         ["chest hurts", "chest tightness", "tight chest", "douleur thoracique", "douleur a la poitrine",
                           "mal a la poitrine", "oppression thoracique"],
    "weakness_in_limbs":  ["weak arms", "weak legs", "faiblesse dans les bras", "faiblesse dans les jambes", "jambes faibles"],
    "fast_heart_rate":    ["racing heart", "rapid heartbeat", "heart racing", "fast heartbeat", "tachycardie",
                           "coeur qui bat vite", "coeur rapide"],
    "pain_during_bowel_movements": ["painful bowel movements", "pain when pooping", "douleur en allant a la selle"],
    "pain_in_anal_region": ["anal pain", "douleur anale", "mal a l anus"],
    "bloody_stool":       ["blood in stool", "bloody stools", "sang dans les selles", "selles sanglantes"],
    "irritation_in_anus": ["anal itching", "demangeaison anale", "irritation anale"],
    "neck_pain":          ["neck hurts", "sore neck", "mal au cou", "douleur au cou", "douleur cervicale"],
    "dizziness":          ["dizzy", "lightheaded", "light headed", "vertige", "vertiges", "etourdissement", "tete qui tourne"],
    "cramps":             ["cramp", "crampe"],
    "bruising":           ["bruise", "bruises", "bleu", "bleus", "hematome", "ecchymose"],
    "obesity":            ["obese", "overweight", "obesite", "surpoids"],
    "swollen_legs":       ["legs swollen", "jambes gonflees", "jambes enflees"],
    "swollen_blood_vessels": ["vaisseaux gonfles"],
    "puffy_face_and_eyes": ["puffy face", "puffy eyes", "visage gonfle", "visage bouffi", "yeux gonfles"],
    "enlarged_thyroid":   ["goiter", "goitre", "thyroide gonflee"],
    "brittle_nails":      ["ongles cassants"],
    "swollen_extremeties": ["swollen hands", "swollen feet", "mains gonflees", "pieds gonfles"],
    "excessive_hunger":   ["always hungry", "very hungry", "faim excessive", "toujours faim"],
    "drying_and_tingling_lips": ["dry lips", "tingling lips", "levres seches", "picotement des levres"],
    "slurred_speech":     ["trouble speaking", "difficulty speaking", "parole difficile", "trouble de la parole",
                           "difficulte a parler", "j ai du mal a parler"],
    "knee_pain":          ["knee hurts", "mal au genou", "mal aux genoux", "douleur au genou"],
    "hip_joint_pain":     ["hip pain", "hip hurts", "mal a la hanche", "douleur a la hanche"],
    "muscle_weakness":    ["weak muscles", "faiblesse musculaire", "muscles faibles"],
    "stiff_neck":         ["neck stiffness", "nuque raide", "raideur de la nuque", "raideur du cou"],
    "swelling_joints":    ["swollen joints", "articulations gonflees", "gonflement des articulations"],
    "movement_stiffness": ["stiffness", "stiff", "raideur", "raide"],
    "spinning_movements": ["room spinning", "spinning", "tout tourne", "la piece tourne"],
    "loss_of_balance":    ["lose my balance", "losing balance", "perte d equilibre", "perte de l equilibre", "desequilibre"],
    "unsteadiness":       ["unsteady", "wobbly", "instable", "instabilite", "demarche instable"],
    "weakness_of_one_body_side": ["one side weak", "weakness on one side", "faiblesse d un cote", "un cote du corps faible",
                                  "paralysie d un cote", "hemiplegie"],
    "loss_of_smell":      ["cannot smell", "no sense of smell", "perte de l odorat", "perte d odorat", "anosmie"],
    "bladder_discomfort": ["bladder pain", "douleur a la vessie", "inconfort vesical"],
    "foul_smell_of_urine": ["smelly urine", "urine smells", "urine malodorante", "urine qui sent mauvais"],
    "continuous_feel_of_urine": ["frequent urge to urinate", "always need to pee", "envie d uriner tout le temps",
                                 "envie frequente d uriner"],
    "passage_of_gases":   ["gas", "flatulence", "farting", "gaz", "flatulences", "ballonnement", "ballonnements"],
    "internal_itching":   ["demangeaison interne"],
    "depression":         ["depressed", "feeling down", "deprime", "deprimee", "depression", "tristesse"],
    "irritability":       ["irritable", "irritabilite", "irritable"],
    "muscle_pain":        ["muscle ache", "muscles ache", "body aches", "sore muscles", "aching muscles", "douleur musculaire",
                           "courbature", "courbatures", "mal aux muscles", "myalgie"],
    "altered_sensorium":  ["confused", "confusion", "disoriented", "confus", "confuse", "desoriente"],
    "red_spots_over_body": ["red spots", "taches rouges", "points rouges"],
    "belly_pain":         ["belly ache", "tummy pain", "mal au bide"],
    "abnormal_menstruation": ["irregular periods", "abnormal periods", "regles irregulieres", "regles anormales"],
    "dischromic_patches": ["skin discoloration", "discolored patches", "taches decolorees", "taches sur la peau"],
    "watering_from_eyes": ["watery eyes", "teary eyes", "yeux qui coulent", "larmoiement"],
    "increased_appetite": ["more hungry", "appetit augmente", "plus d appetit que d habitude"],
    "polyuria":           ["urinating a lot", "peeing a lot", "pee a lot", "frequent urination", "uriner souvent", "urine souvent", "urine beaucoup", "j urine beaucoup"],
    "family_history":     ["runs in my family", "family history", "antecedents familiaux"],
    "mucoid_sputum":      ["mucus when coughing", "crachats muqueux"],
    "rusty_sputum":       ["brown sputum", "crachats rouilles", "crachats bruns"],
    "lack_of_concentration": ["cannot concentrate", "trouble concentrating", "difficulty concentrating",
                              "manque de concentration", "du mal a me concentrer"],
    "visual_disturbances": ["vision problems", "trouble seeing", "troubles visuels", "troubles de la vue"],
    "receiving_blood_transfusion": ["blood transfusion", "transfusion sanguine", "transfusion"],
    "receiving_unsterile_injections": ["unsterile injection", "dirty needle", "injection non sterile"],
    "coma":               ["unconscious", "unresponsive", "inconscient", "perte de connaissance"],
    "stomach_bleeding":   ["vomiting blood", "vomit blood", "vomir du sang", "saignement de l estomac", "hematemese"],
    "distention_of_abdomen": ["bloated", "bloating", "distended abdomen", "ventre ballonne", "abdomen distendu"],
    "history_of_alcohol_consumption": ["drink alcohol", "drinking alcohol", "alcohol", "alcool", "je bois de l alcool"],
    "blood_in_sputum":    ["coughing blood", "coughing up blood", "cough blood", "tousser du sang", "crache du sang",
                           "sang dans les crachats", "hemoptysie"],
    "prominent_veins_on_calf": ["varicose veins", "visible veins on calf", "varices", "veines visibles sur le mollet"],
    "palpitations":       ["heart pounding", "pounding heart", "palpitation", "coeur qui bat fort"],
    "painful_walking":    ["pain when walking", "hurts to walk", "douleur en marchant", "mal en marchant"],
    "pus_filled_pimples": ["pimples", "pimple", "acne", "boutons de pus", "boutons", "bouton"],
    "blackheads":         ["blackhead", "points noirs", "point noir"],
    "scurring":           ["scarring", "scars", "cicatrices"],
    "skin_peeling":       ["peeling skin", "peau qui pele", "desquamation"],
    "silver_like_dusting": ["silvery scales", "squames argentees"],
    "small_dents_in_nails": ["nail pitting", "dents in nails", "petits creux dans les ongles"],
    "inflammatory_nails": ["inflamed nails", "ongles enflammes"],
    "blister":            ["blisters", "ampoule", "ampoules", "cloque", "cloques"],
    "red_sore_around_nose": ["sore around nose", "plaie rouge autour du nez"],
    "yellow_crust_ooze":  ["yellow crust", "croute jaune", "croutes jaunes"],
    "toxic_look_(typhos)": ["toxic look", "aspect toxique"],
}

NEGATORS = {"no", "not", "without", "never", "none", "neither", "nor", "denies",
            "pas", "sans", "aucun", "aucune", "jamais", "ni", "non"}
# Words that end a negation's reach ("no fever but I cough")
CLAUSE_BREAKS = {"but", "however", "although", "mais", "cependant", "pourtant", "par contre"}
NEGATION_WINDOW = 4   # tokens before a phrase that a negator can reach


@dataclass
class ExtractionResult:
    symptoms: list[str] = field(default_factory=list)        # present, in order of mention
    negated: list[str] = field(default_factory=list)         # explicitly denied
    matches: list[dict] = field(default_factory=list)        # {"phrase", "symptom", "negated"}


def normalize_text(text: str) -> str:
    text = text.lower().replace("’", "'")
    text = text.replace("can't", "cannot").replace("won't", "will not").replace("n't", " not")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9.,;!?]+", " ", text)
    text = re.sub(r"([.,;!?])", r" \1 ", text)
    return re.sub(r"\s+", " ", text).strip()


def _build_patterns(known_symptoms: list[str]) -> list[tuple[re.Pattern, str, str]]:
    phrases: dict[str, str] = {}
    for symptom in known_symptoms:
        base = re.sub(r"[_()]+", " ", symptom).strip()
        for phrase in [base, *SYNONYMS.get(symptom, [])]:
            phrase = normalize_text(phrase)
            if phrase:
                phrases.setdefault(phrase, symptom)
    # Longest phrases first so "mild fever" wins over "fever"
    ordered = sorted(phrases.items(), key=lambda kv: len(kv[0]), reverse=True)
    return [
        (re.compile(r"\b" + re.escape(phrase) + r"(?:s|es|x)?\b"), phrase, symptom)
        for phrase, symptom in ordered
    ]


class SymptomTextParser:
    def __init__(self, known_symptoms: list[str]):
        self._patterns = _build_patterns(known_symptoms)

    def parse(self, text: str) -> ExtractionResult:
        norm = normalize_text(text)
        taken = [False] * len(norm)
        found: list[tuple[int, str, str, bool]] = []

        for pattern, phrase, symptom in self._patterns:
            for m in pattern.finditer(norm):
                if any(taken[m.start():m.end()]):
                    continue
                for i in range(m.start(), m.end()):
                    taken[i] = True
                found.append((m.start(), phrase, symptom, _is_negated(norm[:m.start()])))

        result = ExtractionResult()
        for _, phrase, symptom, negated in sorted(found):
            result.matches.append({"phrase": phrase, "symptom": symptom, "negated": negated})
            target = result.negated if negated else result.symptoms
            if symptom not in result.symptoms and symptom not in result.negated:
                target.append(symptom)
        return result


def _is_negated(before: str) -> bool:
    tokens = before.split()
    window = []
    for token in reversed(tokens):
        if token in {".", ",", ";", "!", "?"} or token in CLAUSE_BREAKS:
            break
        window.append(token)
        if len(window) >= NEGATION_WINDOW:
            break
    return any(t in NEGATORS for t in window)
