"""
Answers built from the patient's latest analysis, used by the chat when Claude
is not available (no API key, or the API failed). They cover the questions the
chat page suggests: what the result means, when to seek urgent care, which
signs to watch, and general self-care.
"""
from __future__ import annotations
import re

from app.services import labels

# (intent, pattern) — checked in order, on the lower-cased message
INTENTS = [
    ("urgent",    r"urgen|emergenc|quand .*(consulter|médecin|medecin|docteur)|when .*(see|doctor)"),
    ("watch",     r"surveiller|watch|warning sign|signes? d.alerte|à surveiller|look out"),
    ("lifestyle", r"hygi[eè]ne|lifestyle|mode de vie|self.?care|changements|habits|que faire|what can i do"),
    ("result",    r"r[ée]sultat|analyse|analysis|result|signifi|mean|affection|condition|maladie|disease|probable|diagnos"),
]

URGENCY_NAMES = {
    "fr": {"low": "faible", "moderate": "modérée", "high": "élevée", "emergency": "URGENCE"},
    "en": {"low": "low", "moderate": "moderate", "high": "high", "emergency": "EMERGENCY"},
}

URGENCY_ADVICE = {
    "fr": {
        "emergency": "Votre analyse indique une URGENCE : appelez immédiatement votre numéro d'urgence local ou rendez-vous aux urgences les plus proches.",
        "high": "Le niveau d'urgence est élevé : consultez un médecin dans les 24 heures, et plus tôt si vos symptômes s'aggravent.",
        "moderate": "Le niveau d'urgence est modéré : prenez rendez-vous avec un médecin dans les prochains jours.",
        "low": "Le niveau d'urgence est faible : surveillez vos symptômes et consultez si ils persistent plus de quelques jours ou s'aggravent.",
    },
    "en": {
        "emergency": "Your analysis shows an EMERGENCY: call your local emergency number now or go to the nearest emergency department.",
        "high": "The urgency level is high: see a doctor within 24 hours, sooner if your symptoms get worse.",
        "moderate": "The urgency level is moderate: book an appointment with a doctor in the next few days.",
        "low": "The urgency level is low: keep an eye on your symptoms and see a doctor if they last more than a few days or get worse.",
    },
}

GENERAL_WARNING_SIGNS = {
    "fr": ("Consultez en urgence si vous avez : une douleur à la poitrine ou un essoufflement, une faiblesse d'un côté du corps "
           "ou des troubles de la parole, une confusion, une forte fièvre avec raideur de la nuque, un saignement inhabituel, "
           "ou une aggravation rapide de votre état."),
    "en": ("Get urgent care if you have: chest pain or shortness of breath, weakness on one side of the body or slurred speech, "
           "confusion, a high fever with a stiff neck, unusual bleeding, or if you get worse quickly."),
}

SELF_CARE = {
    "fr": ("Quelques conseils généraux en attendant de voir un médecin :\n"
           "- Reposez-vous et dormez suffisamment.\n"
           "- Buvez régulièrement de l'eau pour rester bien hydraté.\n"
           "- Évitez l'automédication, en particulier les anti-inflammatoires, sans avis médical.\n"
           "- Notez l'évolution de vos symptômes (température, durée, intensité) pour en parler au médecin."),
    "en": ("Some general advice until you see a doctor:\n"
           "- Rest and get enough sleep.\n"
           "- Drink water regularly to stay well hydrated.\n"
           "- Avoid self-medicating, especially anti-inflammatory drugs, without medical advice.\n"
           "- Note how your symptoms change (temperature, duration, intensity) to tell your doctor."),
}

TEXT = {
    "fr": {
        "no_analysis": "Vous n'avez pas encore d'analyse. Lancez le vérificateur de symptômes et je pourrai vous expliquer le résultat.",
        "summary": "D'après votre dernière analyse, l'affection la plus probable est {top} ({pct}).",
        "others": "Autres possibilités : {others}.",
        "urgency": "Niveau d'urgence : {urgency}. Spécialiste conseillé : {specialist}.",
        "uncertain": "Le résultat est incertain : vos symptômes correspondent à plusieurs affections.",
        "flags": "Signes d'alerte détectés :",
        "doctor": "Avis du médecin : {comment}",
        "not_diagnosis": "Ce résultat n'est pas un diagnostic : seul un médecin peut le confirmer.",
        "your_flags": "Dans votre analyse, attention à :",
    },
    "en": {
        "no_analysis": "You don't have an analysis yet. Run the symptom checker and I can explain the result.",
        "summary": "According to your latest analysis, the most likely condition is {top} ({pct}).",
        "others": "Other possibilities: {others}.",
        "urgency": "Urgency level: {urgency}. Recommended specialist: {specialist}.",
        "uncertain": "The result is uncertain: your symptoms match several conditions.",
        "flags": "Warning signs detected:",
        "doctor": "Doctor's review: {comment}",
        "not_diagnosis": "This result is not a diagnosis: only a doctor can confirm it.",
        "your_flags": "In your analysis, watch out for:",
    },
}


def _pct(probability: float, lang: str) -> str:
    """Model probability for display; never shown as a certainty (capped at 99%)."""
    value = round(min(probability, 0.99) * 100)
    return f"{value} %" if lang == "fr" else f"{value}%"


def _intent(message: str) -> str | None:
    text = message.lower()
    for name, pattern in INTENTS:
        if re.search(pattern, text):
            return name
    return None


def _flag_lines(analysis, lang: str) -> list[str]:
    from app.services.pdf_service import TEXT as PDF_TEXT   # localized red-flag messages
    messages = PDF_TEXT[lang]["red_flags"]
    flags = (analysis.ml_details or {}).get("red_flags", [])
    return [f"- {messages.get(f.get('code'), f.get('message', ''))}" for f in flags]


def _urgency(analysis) -> str:
    return analysis.urgency_level.value if analysis.urgency_level else "low"


def answer(message: str, lang: str, analysis) -> str | None:
    """A context-aware answer, or None when the message isn't one of the covered questions."""
    intent = _intent(message)
    if intent is None:
        return None
    t = TEXT[lang]
    if analysis is None:
        return t["no_analysis"] if intent == "result" else _generic(intent, lang)

    urgency = _urgency(analysis)
    if intent == "result":
        preds = [p for p in sorted(analysis.predictions, key=lambda p: p.rank) if p.disease]
        lines = []
        if preds:
            top = preds[0]
            lines.append(t["summary"].format(top=labels.disease(top.disease.name, lang),
                                             pct=_pct(top.confidence_score, lang)))
            others = [f"{labels.disease(p.disease.name, lang)} ({_pct(p.confidence_score, lang)})"
                      for p in preds[1:3] if p.confidence_score >= 0.05]
            if others:
                lines.append(t["others"].format(others=", ".join(others)))
        lines.append(t["urgency"].format(
            urgency=URGENCY_NAMES[lang][urgency],
            specialist=labels.specialist(analysis.recommended_specialist or "Médecin généraliste", lang)))
        if (analysis.ml_details or {}).get("is_uncertain"):
            lines.append(t["uncertain"])
        flags = _flag_lines(analysis, lang)
        if flags:
            lines.append(t["flags"] + "\n" + "\n".join(flags))
        if analysis.doctor_comment:
            lines.append(t["doctor"].format(comment=analysis.doctor_comment.comment))
        lines.append(t["not_diagnosis"])
        return "\n\n".join(lines)

    if intent == "urgent":
        return URGENCY_ADVICE[lang][urgency] + "\n\n" + GENERAL_WARNING_SIGNS[lang]

    if intent == "watch":
        flags = _flag_lines(analysis, lang)
        parts = [t["your_flags"] + "\n" + "\n".join(flags)] if flags else []
        return "\n\n".join(parts + [GENERAL_WARNING_SIGNS[lang], URGENCY_ADVICE[lang][urgency]])

    return SELF_CARE[lang] + "\n\n" + URGENCY_ADVICE[lang][urgency]


def _generic(intent: str, lang: str) -> str:
    if intent == "lifestyle":
        return SELF_CARE[lang]
    return GENERAL_WARNING_SIGNS[lang]
