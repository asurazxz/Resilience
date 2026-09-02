"""LLM transport for the AI features.

This module knows how to talk to a model and nothing else -- no scheme
rules, no eligibility logic, no prompt content. Feature code depends on the
``LLMClient`` protocol rather than on a specific vendor, which is what lets
the tests run without a network call or an API key, and what has let this
swap providers (Anthropic -> Gemini -> Groq) without ``explainer.py`` or
``chat.py`` changing at all.
"""

from __future__ import annotations

import json
from typing import Any, Protocol

from ...core.config import settings

# Covers the answer plus any reasoning tokens the model emits before it.
MAX_OUTPUT_TOKENS = 4096


class LLMUnavailableError(RuntimeError):
    """Raised when no answer could be obtained.

    Callers treat this as "fall back to the deterministic answer", never as
    a request failure -- the core journey must not depend on the LLM.
    """


class LLMClient(Protocol):
    """Returns a JSON object matching the schema it was given."""

    def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]: ...


class GroqClient:
    """Groq implementation of ``LLMClient``.

    Groq's OpenAI-compatible API accepts ``response_format`` of
    ``json_object`` but rejected ``json_schema`` for the models available
    on this key, so the schema is described in the system prompt instead
    and the response is parsed and shape-checked here. Absorbing that
    quirk is this layer's job; the callers keep one provider-neutral
    schema.
    """

    def __init__(self, model: str | None = None) -> None:
        try:
            from groq import Groq
        except ImportError as exc:  # pragma: no cover - import guard
            raise LLMUnavailableError("groq package is not installed") from exc

        if not settings.groq_api_key:
            raise LLMUnavailableError("GROQ_API_KEY is not configured")

        self._model = model or settings.explainer_model
        self._client = Groq(api_key=settings.groq_api_key)

    def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]:
        required = ", ".join(schema.get("required", [])) or "the fields above"
        instructions = (
            f"{system}\n\n"
            "Reply with a single JSON object and nothing else -- no prose "
            "before or after it, and no markdown fences. It must match this "
            f"JSON Schema exactly:\n{json.dumps(schema)}\n"
            f"Required keys: {required}."
        )

        try:
            response = self._client.chat.completions.create(
                model=self._model,
                max_tokens=MAX_OUTPUT_TOKENS,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": user},
                ],
            )
        except Exception as exc:  # noqa: BLE001 - any failure degrades the same way
            raise LLMUnavailableError(f"chat request failed: {exc}") from exc

        if not response.choices:
            raise LLMUnavailableError("model returned no choices")

        choice = response.choices[0]
        # Truncation and malformed output both yield unparseable JSON; only
        # one is worth raising the token ceiling over.
        if choice.finish_reason == "length":
            raise LLMUnavailableError("model response was truncated at max_tokens")

        text = (choice.message.content or "").strip()
        if not text:
            raise LLMUnavailableError("model returned no text content")

        try:
            payload = json.loads(text)
        except json.JSONDecodeError as exc:
            raise LLMUnavailableError("model returned unparseable JSON") from exc

        if not isinstance(payload, dict):
            raise LLMUnavailableError("model returned a non-object JSON value")
        return payload
