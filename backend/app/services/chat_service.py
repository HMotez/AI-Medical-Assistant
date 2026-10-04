"""
Medical chat assistant.
Uses Claude Haiku when ANTHROPIC_API_KEY is set; falls back to rule-based replies.
"""
from __future__ import annotations
import logging
import re
from app.core.config import settings
from app.services.labels import normalize_lang

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are MedAI, an empathetic AI medical assistant embedded in the AI Medical Assistant platform.

Your role:
- Help patients understand their symptoms clearly
- Ask ONE focused follow-up question per reply to refine understanding
- Explain medical terms in plain language
- Provide general health guidance and when to seek care
- Discuss analysis results when context is provided

Rules:
- NEVER give a definitive diagnosis — always recommend consulting a doctor
- Be warm, professional, and concise (2–4 sentences per response)
- Respond in the same language the user writes in (French or English)
- If urgency is 'emergency', strongly advise calling emergency services immediately
- When symptoms suggest something serious, say so calmly but clearly
"""

# Simple rule-based fallback when no API key is configured: (pattern, {lang: reply})
FALLBACK_RESPONSES = [
    (r"bonjour|salut|hello|\bhi\b", {
        "fr": "Bonjour ! Je suis MedAI, votre assistant médical. Décrivez-moi vos symptômes et je ferai de mon mieux pour vous aider. Depuis combien de temps ressentez-vous ces symptômes ?",
        "en": "Hello! I'm MedAI, your AI medical assistant. Tell me about your symptoms and I'll help you understand them better. How long have you been experiencing them?",
    }),
    ("douleur|pain|mal|hurt", {
        "fr": "Je comprends que vous ressentez de la douleur. Pouvez-vous me préciser où exactement et si elle est constante ou intermittente ?",
        "en": "I understand you are in pain. Can you tell me exactly where, and whether it is constant or comes and goes?",
    }),
    ("fièvre|fievre|fever|température|temperature", {
        "fr": "La fièvre peut indiquer une infection. Est-elle accompagnée d'autres symptômes comme des frissons, une toux, ou des courbatures ?",
        "en": "Fever can be a sign of infection. Do you have other symptoms with it, such as chills, a cough or body aches?",
    }),
    ("toux|tousse|cough", {
        "fr": "Une toux persistante mérite attention. Est-elle sèche ou productive ? Y a-t-il du mucus, et de quelle couleur ?",
        "en": "A persistent cough deserves attention. Is it dry or productive? Is there any mucus, and what colour is it?",
    }),
    ("fatigué|fatigue|tired|épuisé|exhausted", {
        "fr": "La fatigue chronique peut avoir de nombreuses causes. Avez-vous remarqué d'autres symptômes associés, comme des vertiges, une perte d'appétit, ou des changements de sommeil ?",
        "en": "Ongoing tiredness can have many causes. Have you noticed other symptoms, such as dizziness, loss of appetite or changes in your sleep?",
    }),
    ("merci|thank", {
        "fr": "Je vous en prie. N'oubliez pas de consulter un médecin pour un diagnostic complet. Prenez soin de vous !",
        "en": "You're welcome. Remember to see a doctor for a full diagnosis. Take care!",
    }),
]

DEFAULT_FALLBACK = {
    "fr": ("Je comprends votre préoccupation. Pour vous aider au mieux, "
           "pourriez-vous me décrire vos symptômes plus en détail ? "
           "Depuis combien de temps les ressentez-vous et quelle est leur intensité ?\n\n"
           "*(Note : configurez ANTHROPIC_API_KEY dans le fichier .env pour activer l'IA avancée.)*"),
    "en": ("I understand your concern. To help you as well as I can, "
           "could you describe your symptoms in more detail? "
           "How long have you had them, and how severe are they?\n\n"
           "*(Note: set ANTHROPIC_API_KEY in the .env file to enable the advanced AI.)*"),
}

AI_ERROR = {
    "fr": "Désolé, l'assistant IA est momentanément indisponible. Voici une réponse simplifiée :",
    "en": "Sorry, the AI assistant is temporarily unavailable. Here is a simplified answer:",
}

LANGUAGE_NAMES = {"fr": "French", "en": "English"}


def _rule_based_reply(message: str, lang: str) -> str:
    msg_lower = message.lower()
    for pattern, replies in FALLBACK_RESPONSES:
        if re.search(pattern, msg_lower):
            return replies[lang]
    return DEFAULT_FALLBACK[lang]


def _build_context_block(context) -> str:
    if not context:
        return ""
    parts = []
    if context.top_disease:
        parts.append(f"Top predicted condition: {context.top_disease}")
    if context.symptoms:
        parts.append(f"Reported symptoms: {', '.join(context.symptoms)}")
    if context.urgency:
        parts.append(f"Urgency level: {context.urgency}")
    if context.specialist:
        parts.append(f"Recommended specialist: {context.specialist}")
    if not parts:
        return ""
    return "\n\nPatient context from latest analysis:\n" + "\n".join(f"- {p}" for p in parts)


def chat(message: str, history: list, context, language: str | None = None) -> dict:
    lang = normalize_lang(language)
    api_key = getattr(settings, "ANTHROPIC_API_KEY", None)

    if not api_key:
        return {"reply": _rule_based_reply(message, lang), "model_used": "rule-based"}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        system = (
            SYSTEM_PROMPT
            + f"\nThe app interface is in {LANGUAGE_NAMES[lang]}; use it unless the user writes in another language."
            + _build_context_block(context)
        )

        messages = [{"role": m.role, "content": m.content} for m in history]
        messages.append({"role": "user", "content": message})

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            system=system,
            messages=messages,
        )
        return {
            "reply": response.content[0].text,
            "model_used": "claude-haiku-4-5",
        }
    except Exception:
        # Details go to the server log, never to the patient
        logger.exception("Claude chat request failed")
        return {
            "reply": AI_ERROR[lang] + "\n\n" + _rule_based_reply(message, lang),
            "model_used": "rule-based-fallback",
        }
