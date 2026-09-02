"""Explainer tests.

No test here reaches the network. The LLM is always a stub, which is also
what proves the safety boundary: the assertions below describe exactly what
the model is shown and what is done with what it returns.
"""

from __future__ import annotations

from typing import Any

import pytest

from app.features.scheme_navigator.evaluator import evaluate_rule
from app.features.scheme_navigator.explainer import build_prompt, explain
from app.features.scheme_navigator.rules import RULES
from app.features.scheme_navigator.schemas import SchemeResult, SchemeStatus
from app.features.scheme_navigator.sources import snippets_for
from app.integrations.ai.client import LLMUnavailableError

WIS = next(rule for rule in RULES if rule.id == "workfare-income-supplement")

FULL_ANSWERS = {
    "citizenship_status": "singapore_citizen",
    "age": 35,
    "monthly_income": 2000,
    "owns_more_than_one_property": False,
    "residence_annual_value": 15000,
    "spouse_annual_income": 0,
    "household_income_per_capita": 600,
    "experiencing_financial_hardship": True,
}


class StubClient:
    """Records the prompt it was given and returns a canned payload."""

    def __init__(self, payload: dict[str, Any]) -> None:
        self.payload = payload
        self.system: str | None = None
        self.user: str | None = None
        self.calls = 0

    def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]:
        self.calls += 1
        self.system = system
        self.user = user
        return self.payload


class FailingClient:
    def __init__(self, error: Exception) -> None:
        self.error = error

    def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]:
        raise self.error


@pytest.fixture
def matched_result() -> SchemeResult:
    result = evaluate_rule(WIS, FULL_ANSWERS)
    assert result.status is SchemeStatus.MATCHED
    return result


@pytest.fixture
def missing_result() -> SchemeResult:
    result = evaluate_rule(WIS, {})
    assert result.status is SchemeStatus.MISSING_INFORMATION
    return result


# --- what the model is shown -------------------------------------------------


def test_prompt_carries_the_decided_outcome(matched_result: SchemeResult) -> None:
    prompt = build_prompt(matched_result, snippets_for(matched_result.rule_id))

    assert matched_result.name in prompt
    assert "may be relevant" in prompt
    for fact in matched_result.matched_facts:
        assert fact in prompt


def test_prompt_includes_every_curated_snippet(matched_result: SchemeResult) -> None:
    snippets = snippets_for(matched_result.rule_id)
    assert snippets, "WIS should have curated sources"

    prompt = build_prompt(matched_result, snippets)
    for snippet in snippets:
        assert snippet.text in prompt
        assert snippet.source_url in prompt


def test_prompt_withholds_the_users_answers(matched_result: SchemeResult) -> None:
    """The model paraphrases an outcome; it never sees the inputs behind it.

    The rule's published criteria *are* in the prompt -- they are the same
    clauses the results UI already shows the user, and the explanation is
    meaningless without them. What must not leak is the person's own
    financial data.
    """

    # Deliberately odd values, so a match cannot be a coincidental substring
    # of a threshold in the criteria text (a plain "0" would be).
    distinctive = {
        "citizenship_status": "singapore_citizen",
        "age": 41,
        "monthly_income": 2417,
        "owns_more_than_one_property": False,
        "residence_annual_value": 13729,
        "spouse_annual_income": 4271,
        "household_income_per_capita": 617,
        "experiencing_financial_hardship": True,
    }
    result = evaluate_rule(WIS, distinctive)
    assert result.status is SchemeStatus.MATCHED

    prompt = build_prompt(result, snippets_for(result.rule_id))

    for key, value in distinctive.items():
        if isinstance(value, int) and not isinstance(value, bool):
            assert str(value) not in prompt, f"answer {key} leaked into the prompt"


def test_explanation_cannot_carry_a_status(matched_result: SchemeResult) -> None:
    """Structural guarantee: there is no field for the model to decide into.

    ``ExplanationResponse`` has no status, so nothing the model returns can
    be mistaken for an eligibility outcome downstream.
    """

    client = StubClient({"summary": "You definitely qualify!", "next_steps": []})

    response = explain(matched_result, client)

    assert not hasattr(response, "status")
    assert "status" not in response.model_dump()


def test_prompt_carries_the_simplified_note(matched_result: SchemeResult) -> None:
    prompt = build_prompt(matched_result, snippets_for(matched_result.rule_id))
    assert matched_result.simplified_note in prompt


def test_missing_information_prompt_names_the_gaps(
    missing_result: SchemeResult,
) -> None:
    prompt = build_prompt(missing_result, snippets_for(missing_result.rule_id))

    assert "could not be checked yet" in prompt
    assert "citizenship status" in prompt


# --- what is done with what comes back --------------------------------------


def test_uses_model_output_when_available(matched_result: SchemeResult) -> None:
    client = StubClient({"summary": "You may qualify.", "next_steps": ["Check CPF."]})

    response = explain(matched_result, client)

    assert client.calls == 1
    assert response.is_ai_generated is True
    assert response.summary == "You may qualify."
    assert response.next_steps == ["Check CPF."]


def test_source_urls_always_include_the_official_source(
    matched_result: SchemeResult,
) -> None:
    client = StubClient({"summary": "Text.", "next_steps": []})

    response = explain(matched_result, client)

    assert matched_result.official_source_url in response.source_urls


def test_blank_summary_falls_back(matched_result: SchemeResult) -> None:
    client = StubClient({"summary": "   ", "next_steps": ["Something"]})

    response = explain(matched_result, client)

    assert response.is_ai_generated is False
    assert response.summary


def test_blank_next_steps_are_dropped(matched_result: SchemeResult) -> None:
    client = StubClient({"summary": "Text.", "next_steps": ["Real step", "", "  "]})

    response = explain(matched_result, client)

    assert response.next_steps == ["Real step"]


# --- degradation -------------------------------------------------------------


def test_no_client_yields_deterministic_explanation(
    matched_result: SchemeResult,
) -> None:
    response = explain(matched_result, None)

    assert response.is_ai_generated is False
    assert response.summary
    assert response.next_steps


def test_unavailable_model_yields_deterministic_explanation(
    matched_result: SchemeResult,
) -> None:
    response = explain(matched_result, FailingClient(LLMUnavailableError("down")))

    assert response.is_ai_generated is False
    assert response.summary


@pytest.mark.parametrize(
    "answers",
    [FULL_ANSWERS, {}, {**FULL_ANSWERS, "age": 20}],
    ids=["matched", "missing", "not_matched"],
)
def test_fallback_covers_every_status(answers: dict[str, Any]) -> None:
    result = evaluate_rule(WIS, answers)

    response = explain(result, None)

    assert response.summary
    assert response.next_steps
    assert response.is_ai_generated is False


def test_fallback_never_claims_eligibility(matched_result: SchemeResult) -> None:
    """Fallback text is user-visible, so it carries the same framing rules."""

    response = explain(matched_result, None)
    text = " ".join([response.summary, *response.next_steps]).lower()

    assert "may be relevant" in text
    assert "you qualify" not in text
    assert "you are eligible" not in text
