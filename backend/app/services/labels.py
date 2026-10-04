"""
English / French display names for symptoms, diseases and specialists.

Single source of truth: frontend/src/i18n/medical-labels.json (the React app
imports it directly). In Docker the file is copied next to this module.
"""
from __future__ import annotations
import json
from functools import lru_cache
from pathlib import Path

SUPPORTED_LANGS = ("en", "fr")
DEFAULT_LANG = "fr"

_CANDIDATES = [
    Path(__file__).parent.parent / "i18n" / "medical-labels.json",                        # Docker copy
    Path(__file__).parents[3] / "frontend" / "src" / "i18n" / "medical-labels.json",      # repository
]


def normalize_lang(lang: str | None) -> str:
    lang = (lang or "").lower()[:2]
    return lang if lang in SUPPORTED_LANGS else DEFAULT_LANG


@lru_cache(maxsize=1)
def _labels() -> dict:
    for path in _CANDIDATES:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    return {"symptoms": {}, "diseases": {}, "specialists": {}}


def _pick(table: str, key: str, lang: str) -> str | None:
    entry = _labels()[table].get(key)
    return entry[SUPPORTED_LANGS.index(normalize_lang(lang))] if entry else None


def symptom(code: str, lang: str) -> str:
    return _pick("symptoms", code, lang) or code.replace("_", " ").strip().capitalize()


def disease(name: str, lang: str) -> str:
    return _pick("diseases", name, lang) or name


def specialist(name: str, lang: str) -> str:
    return _pick("specialists", name, lang) or name
