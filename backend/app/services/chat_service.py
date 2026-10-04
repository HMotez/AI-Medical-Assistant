"""
Medical chat assistant.
Uses Claude (settings.CLAUDE_MODEL) when ANTHROPIC_API_KEY is set, streaming the
reply as it is written; falls back to rule-based replies otherwise.
"""
from __future__ import annotations
import logging
import re
from typing import Iterator

from app.core.config import settings
from app.services import claude_client, offline_answers
from app.services.labels import normalize_lang

logger = logging.getLogger(__name__)

# Only the most recent turns are sent, to keep cost and latency bounded
MAX_HISTORY_MESSAGES = 20
MAX_REPLY_TOKENS = 4096   # covers Claude's (hidden) thinking as well as the reply

SYSTEM_PROMPT = """You are MedAI, the assistant inside the AI Medical Assistant platform. You help patients understand their symptoms and the results of the platform's AI symptom analysis.

How to answer:
- Be warm, calm and clear. Use plain language and explain any medical term you use.
- Keep replies short: usually 2 to 5 sentences. Use a short "- " list only when listing several items.
- Write plain text. Do not use Markdown headings, tables, bold or code formatting.
- When it would help, end with one focused follow-up question.

Medical safety:
- You do not diagnose. The analysis gives likely conditions, not a diagnosis; say so when discussing it, and recommend seeing a doctor (name the recommended specialist when you know it).
- If the patient describes or the analysis shows warning signs (chest pain with breathlessness, stroke signs, confusion, severe bleeding, very high fever with a stiff neck) or an emergency urgency level, tell them clearly to call their local emergency number or go to the emergency department now, before anything else.
- Do not recommend prescription drugs or doses. General self-care advice (rest, fluids, when to seek care) is fine.
- If a question is outside health, briefly say you can only help with health questions."""

LANGUAGE_NAMES = {"fr": "French", "en": "English"}

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
           "Depuis combien de temps les ressentez-vous et quelle est leur intensité ?"),
    "en": ("I understand your concern. To help you as well as I can, "
           "could you describe your symptoms in more detail? "
           "How long have you had them, and how severe are they?"),
}

AI_ERROR = {
    "fr": "Désolé, l'assistant IA est momentanément indisponible. Voici une réponse simplifiée :",
    "en": "Sorry, the AI assistant is temporarily unavailable. Here is a simplified answer:",
}

REFUSAL = {
    "fr": "Je ne peux pas répondre à cette question. Pour toute inquiétude sur votre santé, consultez un médecin ; en cas d'urgence, appelez votre numéro d'urgence local.",
    "en": "I can't help with that question. For any health concern please see a doctor, and in an emergency call your local emergency number.",
}


def _rule_based_reply(message: str, lang: str, analysis=None) -> str:
    # Questions about the analysis, urgency, warning signs or self-care get a real answer
    contextual = offline_answers.answer(message, lang, analysis)
    if contextual:
        return contextual
    msg_lower = message.lower()
    for pattern, replies in FALLBACK_RESPONSES:
        if re.search(pattern, msg_lower):
            return replies[lang]
    return DEFAULT_FALLBACK[lang]


# ── Context from the patient's analysis ─────────────────────────────────────

def describe_analysis(analysis) -> str:
    """Plain-text summary of a stored Analysis for the system prompt."""
    lines = []
    preds = sorted(analysis.predictions, key=lambda p: p.rank)
    if preds:
        lines.append("Most likely conditions (model probability): " + "; ".join(
            f"{p.disease.name} {p.confidence_score:.0%}" for p in preds if p.disease))
    if analysis.urgency_level:
        lines.append(f"Urgency level: {analysis.urgency_level.value}")
    if analysis.recommended_specialist:
        lines.append(f"Recommended specialist: {analysis.recommended_specialist}")
    symptoms = [s.name.replace("_", " ") for s in analysis.symptoms]
    if symptoms:
        lines.append("Reported symptoms: " + ", ".join(symptoms))
    if analysis.severity:
        lines.append(f"Self-rated severity: {analysis.severity}/10")
    if analysis.symptom_duration:
        lines.append(f"Duration code: {analysis.symptom_duration}")
    details = analysis.ml_details or {}
    for flag in details.get("red_flags", []):
        lines.append(f"Warning sign ({flag.get('level')}): {flag.get('message')}")
    if details.get("is_uncertain"):
        lines.append("The analysis is uncertain: the symptoms match several conditions.")
    if analysis.free_text:
        lines.append(f'Patient\'s own words: "{analysis.free_text}"')
    review = analysis.doctor_comment
    if review:
        lines.append(f"Doctor's review: {review.comment}"
                     + (f" (corrected diagnosis: {review.corrected_disease})" if review.corrected_disease else ""))
    created = analysis.created_at.strftime("%Y-%m-%d") if analysis.created_at else "unknown date"
    return f"Latest analysis ({created}):\n" + "\n".join(f"- {line}" for line in lines)


def _legacy_context(context) -> str:
    """Context sent by older clients as loose fields."""
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
    return ("Latest analysis:\n" + "\n".join(f"- {p}" for p in parts)) if parts else ""


def _system_prompt(lang: str, context_text: str) -> str:
    prompt = (SYSTEM_PROMPT
              + f"\n\nThe app interface is in {LANGUAGE_NAMES[lang]}. Reply in {LANGUAGE_NAMES[lang]} "
                "unless the patient writes in another language, then use theirs.")
    if context_text:
        prompt += ("\n\nThe patient's latest analysis from the platform is below. Use it when it is relevant, "
                   "and remind them it is not a diagnosis.\n<analysis>\n" + context_text + "\n</analysis>")
    return prompt


def _messages(message: str, history: list) -> list[dict]:
    """Recent history + the new message; the conversation must start with a user turn."""
    turns = [{"role": m.role, "content": m.content} for m in history
             if m.role in ("user", "assistant") and m.content.strip()][-MAX_HISTORY_MESSAGES:]
    while turns and turns[0]["role"] != "user":
        turns.pop(0)   # e.g. the app's own welcome message
    return turns + [{"role": "user", "content": message}]


# ── Chat ─────────────────────────────────────────────────────────────────────

def stream_chat(message: str, history: list, language: str | None = None,
                context_text: str = "", analysis=None) -> Iterator[dict]:
    """
    Yields events:
      {"type": "text", "text": "..."}         a piece of the reply
      {"type": "refusal", "text": "..."}      replace anything shown so far with this text
      {"type": "done", "model_used": "..."}   always last
    """
    lang = normalize_lang(language)

    if not claude_client.is_enabled():
        yield {"type": "text", "text": _rule_based_reply(message, lang, analysis)}
        yield {"type": "done", "model_used": "rule-based"}
        return

    sent_text = False
    try:
        with claude_client.client().beta.messages.stream(
            **claude_client.request_options(settings.CLAUDE_CHAT_EFFORT),
            max_tokens=MAX_REPLY_TOKENS,
            system=_system_prompt(lang, context_text),
            messages=_messages(message, history),
        ) as stream:
            for text in stream.text_stream:
                if text:
                    sent_text = True
                    yield {"type": "text", "text": text}
            final = stream.get_final_message()
    except Exception:
        # Details go to the server log, never to the patient
        logger.exception("Claude chat request failed")
        fallback = _rule_based_reply(message, lang, analysis)
        if sent_text:
            yield {"type": "refusal", "text": AI_ERROR[lang] + "\n\n" + fallback}
        else:
            yield {"type": "text", "text": AI_ERROR[lang] + "\n\n" + fallback}
        yield {"type": "done", "model_used": "rule-based-fallback"}
        return

    if final.stop_reason == "refusal":
        # Every model in the fallback chain declined: discard any partial reply
        logger.info("Chat refused (category=%s)", getattr(final.stop_details, "category", None))
        yield {"type": "refusal", "text": REFUSAL[lang]}
    yield {"type": "done", "model_used": final.model}


def chat(message: str, history: list, context=None, language: str | None = None,
         context_text: str | None = None, analysis=None) -> dict:
    """Non-streaming variant: collects the streamed reply into one string."""
    if context_text is None:
        context_text = _legacy_context(context)
    reply, model_used = "", "rule-based"
    for event in stream_chat(message, history, language, context_text, analysis):
        if event["type"] == "text":
            reply += event["text"]
        elif event["type"] == "refusal":
            reply = event["text"]
        elif event["type"] == "done":
            model_used = event["model_used"]
    return {"reply": reply, "model_used": model_used}
