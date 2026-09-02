"""Plain-language explanation of an already-decided scheme result.

The safety boundary of this feature lives in this module. The evaluator
decides; this only rephrases. Concretely:

- the model is handed a finished ``SchemeResult`` and curated source text,
  never the user's raw answers or the rules' numeric thresholds;
- the status in the response is copied from the result, never read back out
  of the model's output;
- every failure path -- no API key, network error, refusal, bad JSON --
  returns the deterministic fallback, so the journey never depends on the
  LLM being reachable.
"""

from __future__ import annotations

from datetime import UTC, datetime

from ...integrations.ai.client import LLMClient, LLMUnavailableError
from .schemas import (
    ExplanationResponse,
    SchemeResult,
    SchemeStatus,
    SourceSnippet,
)
from .sources import (
    COMCARE_HOTLINE,
    SUPPORT_GO_WHERE_URL,
    snippets_for,
)

SYSTEM_PROMPT = """You explain Singapore government support schemes to platform \
workers in plain, everyday language.

A separate rules engine has already decided this result. Your only job is to \
rephrase what it decided and what the person can do next.

Rules you must follow:
- Never state or imply that the person is eligible or ineligible. The result \
you are given is a pre-screening signal, not a decision. Describe it as \
"may be relevant" or "did not match the simplified check".
- Never calculate, estimate, or infer any monetary amount, threshold, or date.
- Use only the facts and source extracts provided in the message. If something \
is not covered there, say the official source should be checked instead of \
guessing.
- Do not mention rules, conditions, or criteria that were not given to you.
- Write at most three short sentences for the summary. Be warm and direct.
- Give two or three concrete next steps. Applying or confirming through the \
official channel should be one of them."""

RESPONSE_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "At most three short plain-language sentences.",
        },
        "next_steps": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Two or three concrete actions the person can take.",
        },
    },
    "required": ["summary", "next_steps"],
    "additionalProperties": False,
}

_STATUS_PHRASE: dict[SchemeStatus, str] = {
    SchemeStatus.MATCHED: "may be relevant to this person",
    SchemeStatus.NOT_MATCHED: "did not match the simplified check",
    SchemeStatus.MISSING_INFORMATION: "could not be checked yet, because some answers are missing",
}


def build_prompt(result: SchemeResult, snippets: list[SourceSnippet]) -> str:
    """Renders the user-turn prompt.

    Pure and separate from the API call so tests can assert on exactly what
    the model would be shown -- in particular, that it is not shown the
    numeric thresholds behind the decision.
    """

    lines = [
        f"Scheme: {result.name}",
        f"Administered by: {result.agency}",
        f"Rules-engine outcome: this scheme {_STATUS_PHRASE[result.status]}.",
    ]

    if result.matched_facts:
        lines.append("Conditions the person meets:")
        lines += [f"- {fact}" for fact in result.matched_facts]

    if result.unmatched_reasons:
        lines.append("Conditions the person does not currently meet:")
        lines += [f"- {reason}" for reason in result.unmatched_reasons]

    if result.missing_fields:
        lines.append(
            "Questions still unanswered: "
            + ", ".join(field.replace("_", " ") for field in result.missing_fields)
        )

    lines.append(f"Caveat that must be respected: {result.simplified_note}")

    if snippets:
        lines.append("Extracts from the official source:")
        lines += [f"- {snippet.text} ({snippet.source_url})" for snippet in snippets]

    lines.append("Write the summary and next steps for this person, following your instructions.")
    return "\n".join(lines)


def _fallback(result: SchemeResult, snippets: list[SourceSnippet]) -> ExplanationResponse:
    """Deterministic explanation used whenever the LLM is unavailable."""

    if result.status is SchemeStatus.MATCHED:
        summary = (
            f"Based on your answers, {result.name} may be relevant to you. "
            "This is a pre-screening result from simplified rules, not a decision "
            f"— {result.agency} confirms who actually qualifies."
        )
        next_steps = [
            f"Read the official {result.name} page to confirm the current criteria.",
            "Apply through the official channel if it still looks like a fit.",
        ]
    elif result.status is SchemeStatus.MISSING_INFORMATION:
        readable = ", ".join(f.replace("_", " ") for f in result.missing_fields)
        summary = (
            f"{result.name} could not be checked yet because some answers are missing: {readable}."
        )
        next_steps = [
            "Answer the remaining questions to see whether this scheme may be relevant.",
            f"Check the official {result.agency} page directly if you would rather not "
            "answer them here.",
        ]
    else:
        # A non-match is the closest thing here to a dead end, so it always
        # routes somewhere a person can actually get help.
        summary = (
            f"{result.name} did not match this simplified check. The check uses "
            "approximate rules, so it can be wrong — and criteria change over time."
        )
        next_steps = [
            "Check the official page, since the real criteria may differ from this estimate.",
            f"See what else you might get on SupportGoWhere ({SUPPORT_GO_WHERE_URL}), "
            f"or call ComCare Call on {COMCARE_HOTLINE} to talk to someone.",
        ]

    return ExplanationResponse(
        summary=summary,
        next_steps=next_steps,
        source_urls=_source_urls(result, snippets),
        is_ai_generated=False,
        generated_at=datetime.now(UTC),
    )


def _source_urls(result: SchemeResult, snippets: list[SourceSnippet]) -> list[str]:
    urls = [result.official_source_url]
    for snippet in snippets:
        if snippet.source_url not in urls:
            urls.append(snippet.source_url)
    return urls


def explain(result: SchemeResult, client: LLMClient | None) -> ExplanationResponse:
    """Explains ``result`` in plain language, degrading rather than failing."""

    snippets = snippets_for(result.rule_id)

    if client is None:
        return _fallback(result, snippets)

    try:
        payload = client.complete_json(
            system=SYSTEM_PROMPT,
            user=build_prompt(result, snippets),
            schema=RESPONSE_SCHEMA,
        )
    except LLMUnavailableError:
        return _fallback(result, snippets)

    summary = str(payload.get("summary") or "").strip()
    if not summary:
        return _fallback(result, snippets)

    next_steps = [
        str(step).strip() for step in payload.get("next_steps") or [] if str(step).strip()
    ]

    return ExplanationResponse(
        summary=summary,
        next_steps=next_steps,
        source_urls=_source_urls(result, snippets),
        is_ai_generated=True,
        generated_at=datetime.now(UTC),
    )
