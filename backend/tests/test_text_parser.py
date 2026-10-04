"""
Free-text symptom parser tests — no trained model needed.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from ml.src.text_parser import SYNONYMS, SymptomTextParser  # noqa: E402


@pytest.fixture(scope="module")
def parser():
    return SymptomTextParser(list(SYNONYMS))


@pytest.mark.parametrize("text, present, negated", [
    ("J'ai mal à la tête et des vertiges, pas de fièvre", ["headache", "dizziness"], ["high_fever"]),
    ("I have a bad headache and I feel dizzy. I don't have a fever.", ["headache", "dizziness"], ["high_fever"]),
    ("high fever, chills, sweating and muscle aches", ["high_fever", "chills", "sweating", "muscle_pain"], []),
    ("je tousse, j'ai du mal à respirer et une douleur à la poitrine", ["cough", "breathlessness", "chest_pain"], []),
    ("no cough or sore throat but my nose is running", ["runny_nose"], ["cough", "throat_irritation"]),
    ("ni toux ni fièvre, juste mal au ventre et diarrhée", ["abdominal_pain", "diarrhoea"], ["cough", "high_fever"]),
])
def test_parse_sentences(parser, text, present, negated):
    result = parser.parse(text)
    assert result.symptoms == present
    assert result.negated == negated


def test_contractions(parser):
    result = parser.parse("Chest pain and I can't breathe. I don't have a cough.")
    assert result.symptoms == ["chest_pain", "breathlessness"]
    assert result.negated == ["cough"]


def test_longer_phrase_wins(parser):
    assert parser.parse("mild fever since monday").symptoms == ["mild_fever"]
    assert parser.parse("stiff neck").symptoms == ["stiff_neck"]


def test_symptom_names_with_underscores_are_matched(parser):
    assert parser.parse("I have joint pain").symptoms == ["joint_pain"]


def test_no_duplicates(parser):
    assert parser.parse("cough, coughing, toux").symptoms == ["cough"]


def test_empty_and_unrelated_text(parser):
    assert parser.parse("").symptoms == []
    assert parser.parse("I went to the cinema yesterday").symptoms == []
