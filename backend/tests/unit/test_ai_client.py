"""Gemini transport tests.

``httpx`` is mocked throughout: no test here needs a key, and none reaches
the network. What is asserted is the one contract the feature code relies
on -- ``complete_json`` either returns a JSON object, or raises
``LLMUnavailableError`` so the caller can fall back to its deterministic
answer. Anything else would let a provider hiccup surface as a 500.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import httpx
import pytest

from backend.app.integrations.ai import client as client_module
from backend.app.integrations.ai.client import GeminiClient, LLMUnavailableError

SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {"reply": {"type": "string"}},
    "required": ["reply"],
    "additionalProperties": False,
}


@dataclass
class _Settings:
    gemini_api_key: str = "test-key-not-real"
    gemini_model: str = "gemini-3.6-flash"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    gemini_timeout_seconds: float = 90.0


class _FakeResponse:
    """Stands in for ``httpx.Response``."""

    def __init__(self, status_code: int, body: Any) -> None:
        self.status_code = status_code
        self._body = body
        self.text = body if isinstance(body, str) else json.dumps(body)

    def json(self) -> Any:
        if isinstance(self._body, str):
            raise ValueError("not json")
        return self._body


def _install(
    monkeypatch: pytest.MonkeyPatch, response: Any, **settings: Any
) -> list[dict[str, Any]]:
    """Patches ``httpx.post``; returns the list of kwargs it was called with."""

    calls: list[dict[str, Any]] = []
    monkeypatch.setattr(client_module, "get_settings", lambda: _Settings(**settings))

    def fake_post(url: str, **kwargs: Any) -> Any:
        calls.append({"url": url, **kwargs})
        if isinstance(response, Exception):
            raise response
        return response

    monkeypatch.setattr(httpx, "post", fake_post)
    return calls


def _candidate_response(
    text: str | None,
    finish_reason: str = "STOP",
    *,
    no_parts: bool = False,
) -> _FakeResponse:
    content: dict[str, Any] = {"role": "model"}
    if not no_parts:
        content["parts"] = [{"text": text}] if text is not None else []
    body = {
        "candidates": [{"content": content, "finishReason": finish_reason, "index": 0}],
        "usageMetadata": {"promptTokenCount": 1, "candidatesTokenCount": 1, "totalTokenCount": 2},
    }
    return _FakeResponse(200, body)


def test_missing_key_raises_rather_than_constructing_a_client(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install(monkeypatch, _candidate_response("{}"), gemini_api_key="")

    with pytest.raises(LLMUnavailableError):
        GeminiClient()


def test_successful_parse_returns_the_object(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = _install(monkeypatch, _candidate_response(json.dumps({"reply": "hello"})))

    assert GeminiClient().complete_json("sys", "user", SCHEMA) == {"reply": "hello"}

    sent = calls[0]
    assert sent["url"] == (
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
    )
    assert sent["headers"]["X-goog-api-key"] == "test-key-not-real"
    assert "Authorization" not in sent["headers"]
    body = sent["json"]
    assert body["systemInstruction"] == {"parts": [{"text": "sys"}]}
    assert body["contents"] == [{"role": "user", "parts": [{"text": "user"}]}]
    gen_config = body["generationConfig"]
    assert gen_config["responseMimeType"] == "application/json"
    # additionalProperties is not part of Gemini's schema dialect and must
    # be translated away rather than passed through.
    assert "additionalProperties" not in gen_config["responseSchema"]
    assert gen_config["responseSchema"]["required"] == ["reply"]
    assert gen_config["maxOutputTokens"] == client_module.MAX_OUTPUT_TOKENS
    # thinkingConfig must never be sent: this model rejects it with HTTP
    # 400 regardless of the value (including thinkingBudget: 0).
    assert "thinkingConfig" not in gen_config


def test_transport_error_degrades(monkeypatch: pytest.MonkeyPatch) -> None:
    _install(monkeypatch, httpx.ConnectError("boom"))

    with pytest.raises(LLMUnavailableError):
        GeminiClient().complete_json("sys", "user", SCHEMA)


def test_non_2xx_degrades(monkeypatch: pytest.MonkeyPatch) -> None:
    _install(monkeypatch, _FakeResponse(429, {"error": {"message": "rate limited"}}))

    with pytest.raises(LLMUnavailableError):
        GeminiClient().complete_json("sys", "user", SCHEMA)


def test_503_overload_degrades(monkeypatch: pytest.MonkeyPatch) -> None:
    """A transient "model overloaded" response is just another non-2xx: it
    must degrade to the deterministic answer, not surface as an error."""

    _install(
        monkeypatch,
        _FakeResponse(
            503, {"error": {"message": "The model is overloaded. Please try again later."}}
        ),
    )

    with pytest.raises(LLMUnavailableError):
        GeminiClient().complete_json("sys", "user", SCHEMA)


def test_blocked_prompt_degrades(monkeypatch: pytest.MonkeyPatch) -> None:
    body = {"promptFeedback": {"blockReason": "SAFETY"}, "candidates": []}
    _install(monkeypatch, _FakeResponse(200, body))

    with pytest.raises(LLMUnavailableError, match="blocked"):
        GeminiClient().complete_json("sys", "user", SCHEMA)


@pytest.mark.parametrize("finish_reason", ["SAFETY", "RECITATION"])
def test_safety_or_recitation_finish_degrades(
    monkeypatch: pytest.MonkeyPatch, finish_reason: str
) -> None:
    _install(monkeypatch, _candidate_response(None, finish_reason=finish_reason, no_parts=True))

    with pytest.raises(LLMUnavailableError):
        GeminiClient().complete_json("sys", "user", SCHEMA)


def test_no_candidates_degrades(monkeypatch: pytest.MonkeyPatch) -> None:
    _install(monkeypatch, _FakeResponse(200, {"candidates": []}))

    with pytest.raises(LLMUnavailableError, match="no candidates"):
        GeminiClient().complete_json("sys", "user", SCHEMA)


def test_empty_text_degrades(monkeypatch: pytest.MonkeyPatch) -> None:
    for response in (
        _candidate_response(""),
        _candidate_response(None, no_parts=True),
    ):
        _install(monkeypatch, response)
        with pytest.raises(LLMUnavailableError):
            GeminiClient().complete_json("sys", "user", SCHEMA)


def test_malformed_json_degrades(monkeypatch: pytest.MonkeyPatch) -> None:
    _install(monkeypatch, _candidate_response("this is not json at all"))

    with pytest.raises(LLMUnavailableError):
        GeminiClient().complete_json("sys", "user", SCHEMA)


def test_non_object_json_value_degrades(monkeypatch: pytest.MonkeyPatch) -> None:
    _install(monkeypatch, _candidate_response('["reply"]'))

    with pytest.raises(LLMUnavailableError):
        GeminiClient().complete_json("sys", "user", SCHEMA)


def test_truncation_is_reported_as_truncation(monkeypatch: pytest.MonkeyPatch) -> None:
    """A raised token ceiling fixes this one and not the others, so the
    message has to say which failure it was."""

    _install(
        monkeypatch,
        _candidate_response('{"reply": "half an ans', finish_reason="MAX_TOKENS"),
    )

    with pytest.raises(LLMUnavailableError, match="truncated"):
        GeminiClient().complete_json("sys", "user", SCHEMA)


def test_response_body_not_json_degrades(monkeypatch: pytest.MonkeyPatch) -> None:
    _install(monkeypatch, _FakeResponse(200, "<html>not json</html>"))

    with pytest.raises(LLMUnavailableError):
        GeminiClient().complete_json("sys", "user", SCHEMA)


def test_code_fence_is_stripped(monkeypatch: pytest.MonkeyPatch) -> None:
    """Belt and braces: if the model wraps the JSON in a fence anyway, an
    otherwise good answer should not be thrown away."""

    _install(monkeypatch, _candidate_response('```json\n{"reply": "hi"}\n```'))
    assert GeminiClient().complete_json("sys", "user", SCHEMA) == {"reply": "hi"}
