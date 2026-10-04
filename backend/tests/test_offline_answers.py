"""
Chat answers built from the latest analysis when Claude is not available.
"""
from types import SimpleNamespace

import pytest

from app.services import offline_answers


def _analysis(urgency="high", red_flags=None, uncertain=False, comment=None):
    preds = [
        SimpleNamespace(rank=1, confidence_score=0.9989, disease=SimpleNamespace(name="Dengue")),
        SimpleNamespace(rank=2, confidence_score=0.12, disease=SimpleNamespace(name="Malaria")),
        SimpleNamespace(rank=3, confidence_score=0.01, disease=SimpleNamespace(name="Typhoid")),
    ]
    return SimpleNamespace(
        predictions=preds,
        urgency_level=SimpleNamespace(value=urgency),
        recommended_specialist="Infectiologue",
        ml_details={"red_flags": red_flags or [], "is_uncertain": uncertain},
        doctor_comment=SimpleNamespace(comment=comment) if comment else None,
    )


@pytest.mark.parametrize("question, intent", [
    ("Que signifie le résultat de mon analyse ?", "result"),
    ("Pouvez-vous m'expliquer l'affection la plus probable ?", "result"),
    ("Quand dois-je consulter un médecin en urgence ?", "urgent"),
    ("Quels sont les symptômes à surveiller ?", "watch"),
    ("Quels changements d'hygiène de vie peuvent aider ?", "lifestyle"),
    ("What does my analysis result mean?", "result"),
    ("When should I see a doctor urgently?", "urgent"),
    ("Which symptoms should I watch for?", "watch"),
    ("What lifestyle changes can help?", "lifestyle"),
    ("bonjour", None),
])
def test_suggested_questions_are_recognised(question, intent):
    assert offline_answers._intent(question) == intent


def test_result_summary_in_french():
    text = offline_answers.answer("Que signifie mon résultat ?", "fr", _analysis())
    assert "Dengue (99 %)" in text           # never shown as 100% certain
    assert "Paludisme (12 %)" in text        # translated, and the 1% option is left out
    assert "Typhoïde" not in text
    assert "Infectiologue" in text and "élevée" in text
    assert "pas un diagnostic" in text


def test_result_summary_includes_flags_review_and_uncertainty():
    analysis = _analysis(red_flags=[{"code": "jaundice", "level": "moderate", "message": "x"}],
                         uncertain=True, comment="Please get a blood test.")
    text = offline_answers.answer("What does my result mean?", "en", analysis)
    assert "Infectious disease specialist" in text
    assert "Yellowing of the skin" in text
    assert "uncertain" in text
    assert "Please get a blood test." in text


def test_emergency_advice_comes_first():
    text = offline_answers.answer("When should I see a doctor urgently?", "en", _analysis(urgency="emergency"))
    assert text.startswith("Your analysis shows an EMERGENCY")


def test_without_analysis():
    assert "symptom checker" in offline_answers.answer("What does my result mean?", "en", None)
    assert "Drink water" in offline_answers.answer("What lifestyle changes can help?", "en", None)


def test_unrelated_message_is_not_handled():
    assert offline_answers.answer("bonjour", "fr", _analysis()) is None
