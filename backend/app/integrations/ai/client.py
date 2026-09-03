"""LLM transport for the AI features.

This module knows how to talk to a model and nothing else -- no scheme
rules, no eligibility logic, no prompt content. Feature code depends on the
``LLMClient`` protocol rather than on a specific vendor, which is what lets
the tests run without a network call or an API key, and what has let this
swap providers (Anthropic -> Gemini -> Grok -> Groq -> Gemini) without
``explainer.py`` or ``chat.py`` changing at all.
"""

from __future__ import annotations

import json
from typing import Any, Protocol

import httpx

from ...core.settings import get_settings

# Reasoning is billed against this same ceiling. ``thinkingConfig`` cannot
# be used to disable or size it (see ``GeminiClient``) -- the model thinks
# internally regardless, invisibly spending roughly 1,600 tokens before the
# answer starts. Measured against a full Scheme Navigator chat prompt
# (system prompt plus all four scheme snippets, ~10k characters): at 2048
# the invisible thinking alone ate the ceiling and the answer came back
# truncated (``finishReason: MAX_TOKENS``, unparseable JSON); at 8192 the
# same prompt finished with ``STOP`` using only ~293 answer tokens. Do not
# lower this back toward 2048.
MAX_OUTPUT_TOKENS = 8192

# Sampling settings supplied with the model choice.
TEMPERATURE = 0.6
TOP_P = 0.95


class LLMUnavailableError(RuntimeError):
    """Raised when no answer could be obtained.

    Callers treat this as "fall back to the deterministic answer", never as
    a request failure -- the core journey must not depend on the LLM.
    """


class LLMClient(Protocol):
    """Returns a JSON object matching the schema it was given."""

    def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]: ...


def _strip_code_fence(text: str) -> str:
    """Removes a ```json ... ``` wrapper if the model added one.

    Asking for "JSON and nothing else" mostly works, but a fenced block is
    the common near-miss and is cheap to recover from here rather than
    throwing away an otherwise good answer.
    """

    if not text.startswith("```"):
        return text
    body = text[3:]
    newline = body.find("\n")
    if newline == -1:
        return text
    body = body[newline + 1 :]
    closing = body.rfind("```")
    return body[:closing].strip() if closing != -1 else text


def _to_gemini_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """Translates a caller's JSON Schema into Gemini's restricted dialect.

    Gemini's ``responseSchema`` is a subset of OpenAPI 3.0's schema object,
    not full JSON Schema, and it rejects unknown keywords outright --
    notably ``additionalProperties``, which every schema in this codebase
    sets. Recognised keywords (``type``, ``properties``, ``items``,
    ``required``, ``description``, ``enum``) pass through unchanged; the
    caller's exact JSON Schema still gets described in the prompt and
    checked against the parsed result, so a keyword dropped here does not
    silently lose that constraint.
    """

    if not isinstance(schema, dict):
        return schema

    allowed = {
        "type",
        "properties",
        "items",
        "required",
        "description",
        "enum",
        "format",
        "nullable",
    }
    result: dict[str, Any] = {}
    for key, value in schema.items():
        if key not in allowed:
            continue
        if key == "properties" and isinstance(value, dict):
            result[key] = {k: _to_gemini_schema(v) for k, v in value.items()}
        elif key == "items" and isinstance(value, dict):
            result[key] = _to_gemini_schema(value)
        else:
            result[key] = value
    return result


class GeminiClient:
    """Google Gemini implementation of ``LLMClient``.

    Talks to the ``generateContent`` REST endpoint directly with ``httpx``
    rather than the ``google-genai`` SDK -- one POST does not justify the
    dependency. Constructed with the key from settings rather than the
    ambient environment so that an unconfigured deployment fails here, as a
    clean ``LLMUnavailableError``, instead of surfacing later as a request
    error.

    Four things about this API shape this code, all confirmed against the
    live API rather than assumed:

    - Auth is the ``X-goog-api-key`` header, not ``Authorization: Bearer``.
    - There is no ``messages`` array or system role. The system prompt goes
      in a top-level ``systemInstruction``; the user turn goes in
      ``contents``. Generation parameters (including the token ceiling)
      live under ``generationConfig``.
    - ``gemini-flash-latest`` looks like the obvious default and appears in
      the model list claiming to support ``generateContent``, but a real
      POST to it never returns -- it hung past 90 seconds in testing while
      every other model on the same key errored or answered in under 16.
      Do not switch the default back to it; use ``gemini-3.6-flash``.
    - This is a reasoning model, and thinking is *not* free: it happens
      internally regardless of any setting, and the model does not surface
      it in the response text (``candidates[0].content.parts[0].text``
      comes back as clean JSON either way; ignore the ``thoughtSignature``
      field alongside it). ``generationConfig.thinkingConfig`` -- including
      ``thinkingBudget: 0`` to try to disable it -- is rejected outright
      with HTTP 400 on this model, so it is not sent at all. Because the
      thinking is invisible but not free, it still consumes tokens against
      ``maxOutputTokens`` before the visible answer starts (roughly 1,600
      of them observed), which is why that ceiling is 8192 and not smaller
      -- see ``MAX_OUTPUT_TOKENS``.

    Unlike the previous OpenAI-compatible providers, this API supports
    structured output natively (``responseMimeType: "application/json"``
    with a ``responseSchema``), which is used here instead of describing
    the schema in the prompt and hoping. Its schema dialect is a restricted
    subset of OpenAPI/JSON Schema, so the caller's schema is translated by
    ``_to_gemini_schema`` rather than passed through -- passing
    ``additionalProperties`` straight through is rejected outright by the
    API. Parsing and shape-checking the result stays in place as a
    backstop regardless.

    Not streamed: ``complete_json`` has to return one fully parsed object,
    so a stream would only be reassembled in full before parsing.
    """

    def __init__(self, model: str | None = None) -> None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise LLMUnavailableError("GEMINI_API_KEY is not configured")

        self._model = model or settings.gemini_model
        self._base_url = settings.gemini_base_url.rstrip("/")
        self._api_key = settings.gemini_api_key
        self._timeout = settings.gemini_timeout_seconds

    def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]:
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": TEMPERATURE,
                "topP": TOP_P,
                "maxOutputTokens": MAX_OUTPUT_TOKENS,
                "responseMimeType": "application/json",
                "responseSchema": _to_gemini_schema(schema),
                # No thinkingConfig here: see the class docstring -- this
                # model rejects it with HTTP 400 regardless of the value.
            },
        }

        try:
            response = httpx.post(
                f"{self._base_url}/models/{self._model}:generateContent",
                headers={
                    "X-goog-api-key": self._api_key,
                    "Content-Type": "application/json",
                },
                json=body,
                timeout=self._timeout,
            )
        except httpx.HTTPError as exc:
            raise LLMUnavailableError(f"chat request failed: {exc}") from exc

        if response.status_code != 200:
            raise LLMUnavailableError(
                f"chat request failed: HTTP {response.status_code} {response.text[:500]}"
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise LLMUnavailableError("model response was not valid JSON") from exc

        return _parse_response(payload)


def _parse_response(payload: dict[str, Any]) -> dict[str, Any]:
    """Turns a ``generateContent`` response body into the parsed JSON object.

    Truncation is reported separately from malformed output because only
    one of the two is fixed by raising ``MAX_OUTPUT_TOKENS``. A blocked
    prompt or an unsafe/recitation finish are also reported distinctly from
    a generic empty response, since -- unlike a transport failure -- these
    are Gemini actively declining to answer, and matter for anyone auditing
    why a legitimate question (e.g. about financial hardship) got no reply.
    """

    block_reason = (payload.get("promptFeedback") or {}).get("blockReason")
    if block_reason:
        raise LLMUnavailableError(f"prompt was blocked by the model: {block_reason}")

    candidates = payload.get("candidates") or []
    if not candidates:
        raise LLMUnavailableError("model returned no candidates")

    candidate = candidates[0]
    finish_reason = candidate.get("finishReason")
    if finish_reason in ("SAFETY", "RECITATION"):
        raise LLMUnavailableError(f"model declined to answer: {finish_reason}")
    if finish_reason == "MAX_TOKENS":
        raise LLMUnavailableError("model response was truncated before the JSON was complete")

    parts = (candidate.get("content") or {}).get("parts") or []
    raw = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
    if not isinstance(raw, str) or not raw.strip():
        raise LLMUnavailableError("model returned no text content")

    text = _strip_code_fence(raw.strip()).strip()
    if not text:
        raise LLMUnavailableError("model returned no text content")

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise LLMUnavailableError("model returned unparseable JSON") from exc

    if not isinstance(parsed, dict):
        raise LLMUnavailableError("model returned a non-object JSON value")
    return parsed
