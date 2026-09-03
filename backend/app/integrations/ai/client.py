"""LLM transport for the AI features.

This module knows how to talk to a model and nothing else -- no scheme
rules, no eligibility logic, no prompt content. Feature code depends on the
``LLMClient`` protocol rather than on a specific vendor, which is what lets
the tests run without a network call or an API key, and what has let this
swap providers (Anthropic -> Gemini -> Groq -> Grok) without ``explainer.py``
or ``chat.py`` changing at all.
"""

from __future__ import annotations

import json
from typing import Any, Protocol

import httpx

from ...core.settings import get_settings

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


class GrokClient:
    """x.ai (Grok) implementation of ``LLMClient``.

    Talks to the Responses API (``POST {base_url}/responses``) directly over
    ``httpx``; no vendor SDK is involved, which keeps the dependency list to
    one HTTP library that the project already uses.

    The Responses API returns the answer inside a list of output items
    rather than a single message, so ``_extract_text`` walks that structure:
    each item may be reasoning (skipped), a refusal, or a message whose
    ``content`` parts carry ``output_text``. ``status`` is checked first so
    a truncated or failed generation is reported as such instead of
    surfacing as unparseable JSON.

    The schema is described in the system prompt and the reply is parsed and
    shape-checked here, the same approach the previous provider needed.
    Absorbing that quirk is this layer's job; the callers keep one
    provider-neutral schema.
    """

    def __init__(self, model: str | None = None) -> None:
        settings = get_settings()
        if not settings.xai_api_key:
            raise LLMUnavailableError("XAI_API_KEY is not configured")

        self._model = model or settings.xai_model
        self._api_key = settings.xai_api_key
        self._url = settings.xai_base_url.rstrip("/") + "/responses"
        self._timeout = settings.xai_timeout_seconds

    def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]:
        required = ", ".join(schema.get("required", [])) or "the fields above"
        instructions = (
            f"{system}\n\n"
            "Reply with a single JSON object and nothing else -- no prose "
            "before or after it, and no markdown fences. It must match this "
            f"JSON Schema exactly:\n{json.dumps(schema)}\n"
            f"Required keys: {required}."
        )

        payload = {
            "model": self._model,
            "max_output_tokens": MAX_OUTPUT_TOKENS,
            "input": [
                {"role": "system", "content": instructions},
                {"role": "user", "content": user},
            ],
        }

        try:
            response = httpx.post(
                self._url,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=self._timeout,
            )
        except Exception as exc:  # noqa: BLE001 - any transport failure degrades the same way
            raise LLMUnavailableError(f"chat request failed: {exc}") from exc

        if response.status_code < 200 or response.status_code >= 300:
            raise LLMUnavailableError(f"model returned HTTP {response.status_code}")

        try:
            body = response.json()
        except Exception as exc:  # noqa: BLE001 - httpx raises several decoder types
            raise LLMUnavailableError("model returned an unparseable body") from exc

        if not isinstance(body, dict):
            raise LLMUnavailableError("model returned a non-object body")

        text = _strip_code_fence(self._extract_text(body))
        if not text:
            raise LLMUnavailableError("model returned no text content")

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            raise LLMUnavailableError("model returned unparseable JSON") from exc

        if not isinstance(parsed, dict):
            raise LLMUnavailableError("model returned a non-object JSON value")
        return parsed

    @staticmethod
    def _extract_text(body: dict[str, Any]) -> str:
        """Pulls the assistant text out of a Responses API body.

        Raises rather than returning "" when the response carries an
        explicit failure, truncation, or refusal signal, so those are not
        misreported downstream as an empty answer.
        """

        error = body.get("error")
        if error:
            raise LLMUnavailableError(f"model reported an error: {error}")

        status = body.get("status")
        if status == "incomplete":
            details = body.get("incomplete_details") or {}
            reason = details.get("reason") if isinstance(details, dict) else None
            raise LLMUnavailableError(f"model response was incomplete: {reason or 'unknown'}")
        if status == "failed":
            raise LLMUnavailableError("model response failed")

        chunks: list[str] = []
        for item in body.get("output") or []:
            if not isinstance(item, dict) or item.get("type") != "message":
                continue
            content = item.get("content")
            if isinstance(content, str):
                chunks.append(content)
                continue
            for part in content or []:
                if not isinstance(part, dict):
                    continue
                if part.get("type") == "refusal":
                    raise LLMUnavailableError(f"model refused: {part.get('refusal')}")
                if isinstance(part.get("text"), str):
                    chunks.append(part["text"])

        if not chunks:
            # Some responses carry only the flattened convenience field.
            flattened = body.get("output_text")
            if isinstance(flattened, str):
                chunks.append(flattened)

        return "".join(chunks).strip()
