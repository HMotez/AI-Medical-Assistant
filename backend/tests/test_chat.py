"""
Claude chat + symptom reading, with a fake Anthropic client (no network, no API key needed).
"""
import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.schemas.chat import ChatMessage
from app.services import chat_service, claude_client
from main import app


# ── Fake Anthropic client ───────────────────────────────────────────────────

class FakeStream:
    def __init__(self, chunks, stop_reason, model, error=None):
        self._chunks, self._stop_reason, self._model, self._error = chunks, stop_reason, model, error

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    @property
    def text_stream(self):
        for chunk in self._chunks:
            yield chunk
        if self._error:
            raise self._error

    def get_final_message(self):
        return SimpleNamespace(stop_reason=self._stop_reason, model=self._model,
                               stop_details=SimpleNamespace(category="bio"))


class FakeClient:
    def __init__(self, chunks=("Hello", " there."), stop_reason="end_turn",
                 model="claude-opus-5-5", error=None, create_response=None):
        self.calls = []
        self._stream = (chunks, stop_reason, model, error)
        self._create_response = create_response
        self.beta = SimpleNamespace(messages=SimpleNamespace(stream=self._stream_call, create=self._create_call))

    def _stream_call(self, **kwargs):
        self.calls.append(kwargs)
        return FakeStream(*self._stream)

    def _create_call(self, **kwargs):
        self.calls.append(kwargs)
        return self._create_response


@pytest.fixture
def fake_claude(monkeypatch):
    """Install a fake client and an API key; returns a setter for the fake."""
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "test-key")
    holder = {}

    def install(fake):
        holder["fake"] = fake
        monkeypatch.setattr(claude_client, "client", lambda: fake)
        return fake
    return install


# ── Streaming chat ──────────────────────────────────────────────────────────

def test_stream_sends_text_then_done(fake_claude):
    fake = fake_claude(FakeClient())
    events = list(chat_service.stream_chat("I have a fever", [], "en"))
    assert [e["type"] for e in events] == ["text", "text", "done"]
    assert "".join(e["text"] for e in events if e["type"] == "text") == "Hello there."
    assert events[-1]["model_used"] == "claude-opus-5-5"

    call = fake.calls[0]
    assert call["model"] == settings.CLAUDE_MODEL
    assert call["fallbacks"] == "default"
    assert call["betas"] == [claude_client.FALLBACK_BETA]
    assert call["output_config"] == {"effort": settings.CLAUDE_CHAT_EFFORT}
    assert "thinking" not in call   # always adaptive on Opus 5.5; disabling it is a 400


def test_history_must_start_with_user_turn(fake_claude):
    fake = fake_claude(FakeClient())
    history = [ChatMessage(role="assistant", content="Welcome!"),
               ChatMessage(role="user", content="Hi"),
               ChatMessage(role="assistant", content="Hello, how can I help?")]
    list(chat_service.stream_chat("I have a cough", history, "en"))
    messages = fake.calls[0]["messages"]
    assert messages[0] == {"role": "user", "content": "Hi"}
    assert messages[-1] == {"role": "user", "content": "I have a cough"}


def test_history_is_capped(fake_claude):
    fake = fake_claude(FakeClient())
    history = [ChatMessage(role="user" if i % 2 == 0 else "assistant", content=f"m{i}") for i in range(50)]
    list(chat_service.stream_chat("latest", history, "en"))
    assert len(fake.calls[0]["messages"]) <= chat_service.MAX_HISTORY_MESSAGES + 1


def test_system_prompt_language_and_context(fake_claude):
    fake = fake_claude(FakeClient())
    list(chat_service.stream_chat("Que signifie mon résultat ?", [], "fr", "Latest analysis:\n- Malaria 66%"))
    system = fake.calls[0]["system"]
    assert "Reply in French" in system
    assert "Malaria 66%" in system and "<analysis>" in system


def test_refusal_replaces_partial_reply(fake_claude):
    fake_claude(FakeClient(chunks=("Partial",), stop_reason="refusal"))
    events = list(chat_service.stream_chat("question", [], "fr"))
    assert events[-2] == {"type": "refusal", "text": chat_service.REFUSAL["fr"]}
    assert chat_service.chat("question", [], language="fr")["reply"] == chat_service.REFUSAL["fr"]


def test_api_error_falls_back_to_rules(fake_claude):
    fake_claude(FakeClient(chunks=(), error=RuntimeError("network down")))
    result = chat_service.chat("I have a fever", [], language="en")
    assert result["model_used"] == "rule-based-fallback"
    assert result["reply"].startswith(chat_service.AI_ERROR["en"])
    assert "network down" not in result["reply"]   # never leak internals to the patient


def test_error_mid_stream_replaces_partial(fake_claude):
    fake_claude(FakeClient(chunks=("Half a sen",), error=RuntimeError("dropped")))
    events = list(chat_service.stream_chat("hello", [], "en"))
    assert events[-2]["type"] == "refusal"
    assert events[-1]["model_used"] == "rule-based-fallback"


def test_no_api_key_uses_rules(monkeypatch):
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
    events = list(chat_service.stream_chat("hello", [], "fr"))
    assert events[0]["text"].startswith("Bonjour")
    assert events[-1]["model_used"] == "rule-based"


# ── Symptom reading ─────────────────────────────────────────────────────────

def _json_response(payload, stop_reason="end_turn"):
    return SimpleNamespace(stop_reason=stop_reason,
                           content=[SimpleNamespace(type="text", text=json.dumps(payload))])


def test_claude_extraction_filters_unknown_codes(fake_claude):
    fake = fake_claude(FakeClient(create_response=_json_response(
        {"present": ["headache", "not_a_symptom", "headache"], "absent": ["high_fever", "headache"]})))
    result = claude_client.extract_symptoms("mal à la tête, pas de fièvre", ["headache", "high_fever", "cough"])
    assert result == {"symptoms": ["headache"], "negated": ["high_fever"]}
    schema = fake.calls[0]["output_config"]["format"]["schema"]
    assert schema["properties"]["present"]["items"]["enum"] == ["cough", "headache", "high_fever"]


def test_claude_extraction_refusal_returns_none(fake_claude):
    fake_claude(FakeClient(create_response=_json_response({}, stop_reason="refusal")))
    assert claude_client.extract_symptoms("text", ["headache"]) is None


def test_claude_extraction_disabled_without_key(monkeypatch):
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
    assert claude_client.extract_symptoms("text", ["headache"]) is None


# ── Streaming endpoint + analysis context ──────────────────────────────────

engine = create_engine("sqlite:///./test_chat.db", connect_args={"check_same_thread": False})
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def api():
    Base.metadata.create_all(bind=engine)

    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def _login(c, email):
    c.post("/api/auth/register", json={"email": email, "password": "Secure123!", "full_name": email.split("@")[0]})
    token = c.post("/api/auth/login", json={"email": email, "password": "Secure123!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_stream_endpoint_uses_own_analysis_only(api, fake_claude):
    from unittest.mock import patch
    fake = fake_claude(FakeClient())
    owner, other = _login(api, "owner@x.com"), _login(api, "other@x.com")
    mock = {
        "predictions": [{"disease": "Malaria", "confidence": 0.66, "rank": 1, "specialist": "Infectiologue"}],
        "urgency_level": "high", "recommended_specialist": "Infectiologue",
        "shap_explanation": {}, "symptom_vector": [],
        "details": {"red_flags": [], "is_uncertain": False, "follow_up_questions": []},
    }
    with patch("app.services.ml_service.analyze", return_value=mock):
        analysis_id = api.post("/api/analysis/", json={"symptom_names": ["chills"]}, headers=owner).json()["id"]

    body = {"message": "Explain my result", "language": "en", "context": {"analysis_id": analysis_id}}
    res = api.post("/api/chat/stream", json=body, headers=owner)
    assert res.status_code == 200
    events = [json.loads(line) for line in res.text.splitlines()]
    assert events[-1]["type"] == "done"
    assert "Malaria 66%" in fake.calls[-1]["system"] and "chills" in fake.calls[-1]["system"]

    api.post("/api/chat/stream", json=body, headers=other)
    assert "Malaria" not in fake.calls[-1]["system"]   # someone else's analysis is never shared
