"""Chatbot tests.

The LLM is a stub throughout; no test reaches the network. The assertions
describe the scoped assistant's contract: what it is shown, what its
instructions forbid, and that it degrades instead of failing.
"""

from __future__ import annotations

from typing import Any

import pytest

from backend.app.features.scheme_navigator.chat import (
    FALLBACK_REPLY,
    SUPPORT_GO_WHERE_URL,
    SYSTEM_PROMPT,
    build_chat_prompt,
    chat,
    unanswered_questions,
)
from backend.app.features.scheme_navigator.evaluator import evaluate_all
from backend.app.features.scheme_navigator.rules import RULES
from backend.app.features.scheme_navigator.schemas import (
    ChatMessage,
    SchemeResult,
    SchemeStatus,
)
from backend.app.features.scheme_navigator.sources import COMCARE_HOTLINE, snippets_for
from backend.app.integrations.ai.client import LLMUnavailableError

ANSWERS: dict[str, Any] = {
    "citizenship_status": "singapore_citizen",
    "age": 35,
    "monthly_income": 1500,
    "owns_more_than_one_property": False,
    "residence_annual_value": 10000,
    "spouse_annual_income": 0,
    "household_income_per_capita": 400,
    "experiencing_financial_hardship": True,
}


class StubClient:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.payload = payload
        self.system: str | None = None
        self.user: str | None = None

    def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]:
        self.system = system
        self.user = user
        return self.payload


class FailingClient:
    def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]:
        raise LLMUnavailableError("unreachable")


@pytest.fixture
def results() -> list[SchemeResult]:
    return evaluate_all(RULES, ANSWERS).results


def turn(text: str) -> list[ChatMessage]:
    return [ChatMessage(role="user", content=text)]


# --- the instructions --------------------------------------------------------


def test_system_prompt_forbids_the_dangerous_behaviours() -> None:
    lowered = SYSTEM_PROMPT.lower()

    assert "never tell the person they are eligible" in lowered
    assert "never calculate" in lowered
    assert "financial, budgeting, tax, legal, or investment advice" in lowered


def test_system_prompt_defines_both_answering_modes() -> None:
    """Personal questions use their answers; general ones read like a search."""

    lowered = SYSTEM_PROMPT.lower()

    assert "1. about them" in lowered
    assert "2. general" in lowered
    # Personal mode must defer to the evaluator, not re-derive the outcome.
    assert "never work it out yourself" in lowered
    # General mode must not drag their finances into an impersonal question.
    assert "do not pull in \\\ntheir personal answers" in lowered or (
        "do not pull in" in lowered and "their personal answers" in lowered
    )


def test_fallback_routes_somewhere_real_instead_of_reporting_a_fault() -> None:
    """A person asking about money must never hit a dead end.

    "The assistant is unavailable" is a status report, useless to someone
    looking for financial help. Every dead end names a place to go instead.
    """

    lowered = FALLBACK_REPLY.lower()

    assert SUPPORT_GO_WHERE_URL in FALLBACK_REPLY
    assert COMCARE_HOTLINE in FALLBACK_REPLY
    for excuse in ("unavailable", "offline", "error", "try again later", "broken"):
        assert excuse not in lowered, f"fallback should not say {excuse!r}"


def test_system_prompt_forbids_dead_ends() -> None:
    lowered = SYSTEM_PROMPT.lower()

    assert "never end on a dead end" in lowered
    assert "never describe yourself as unavailable" in lowered
    assert COMCARE_HOTLINE in SYSTEM_PROMPT


def test_system_prompt_constrains_talk_about_uncurated_schemes() -> None:
    """The bot may discuss schemes beyond the four, but not silently.

    Widening scope to any Singapore scheme means it can speak from model
    knowledge nobody reviewed. These instructions are what keep that
    honest; if someone deletes them the widening becomes unsafe.
    """

    lowered = SYSTEM_PROMPT.lower()

    assert "has not checked or verified" in lowered
    assert SUPPORT_GO_WHERE_URL in SYSTEM_PROMPT
    assert "never invent specific criteria, amounts, dates, or quotas" in lowered


# --- what the model is shown -------------------------------------------------


def test_prompt_carries_results_and_the_question(results: list[SchemeResult]) -> None:
    prompt = build_chat_prompt(turn("Why do I match WIS?"), ANSWERS, results)

    assert "Why do I match WIS?" in prompt
    assert "Workfare Income Supplement (WIS)" in prompt


def test_prompt_carries_the_reasons_a_scheme_matched(
    results: list[SchemeResult],
) -> None:
    """ "Why do I get this?" must be answerable from the evaluator's reasons.

    Without them the model would have to re-derive the outcome from the
    person's raw figures, which the safety rules forbid.
    """

    matched = [r for r in results if r.status is SchemeStatus.MATCHED]
    assert matched, "fixture should match at least one scheme"

    prompt = build_chat_prompt(turn("Why do I get these?"), ANSWERS, results)

    for result in matched:
        for fact in result.matched_facts:
            assert fact in prompt


def test_prompt_carries_answers_using_their_question_labels(
    results: list[SchemeResult],
) -> None:
    """The chatbot deliberately sees answers -- see the module docstring."""

    prompt = build_chat_prompt(turn("Why?"), ANSWERS, results)

    assert "What is your age?" in prompt
    assert "35" in prompt
    # Booleans and select options render readably, not as Python repr.
    assert "True" not in prompt
    assert "singapore_citizen" not in prompt
    assert "Singapore Citizen" in prompt


def test_prompt_includes_curated_extracts(results: list[SchemeResult]) -> None:
    prompt = build_chat_prompt(turn("Tell me about WIS"), ANSWERS, results)

    wis = next(r for r in RULES if r.id == "workfare-income-supplement")
    assert wis.support_go_where_url in prompt
    for snippet in snippets_for(wis.id):
        assert snippet.text in prompt


def test_every_rule_links_to_support_go_where() -> None:
    """A scheme with no canonical link cannot be cited in a general answer."""

    for rule in RULES:
        assert rule.support_go_where_url.startswith(
            "https://supportgowhere.life.gov.sg/schemes/"
        ), f"{rule.id} has no SupportGoWhere page"


def test_every_rule_has_curated_sources() -> None:
    """Otherwise the model answers about that scheme from memory instead."""

    for rule in RULES:
        assert snippets_for(rule.id), f"{rule.id} has no curated sources"


def test_prompt_replays_recent_history(results: list[SchemeResult]) -> None:
    messages = [
        ChatMessage(role="user", content="What is ComCare?"),
        ChatMessage(role="assistant", content="It is temporary assistance."),
        ChatMessage(role="user", content="How do I apply?"),
    ]

    prompt = build_chat_prompt(messages, ANSWERS, results)

    assert "What is ComCare?" in prompt
    assert "It is temporary assistance." in prompt
    assert "Their question: How do I apply?" in prompt


def test_prompt_bounds_history_growth(results: list[SchemeResult]) -> None:
    messages = [ChatMessage(role="user", content=f"question {i}") for i in range(30)]

    prompt = build_chat_prompt(messages, ANSWERS, results)

    assert "question 29" in prompt
    assert "question 0" not in prompt


def test_prompt_names_the_unanswered_questions() -> None:
    """Asked what they can get mid-questionnaire, it must know what is blank."""

    partial = {"citizenship_status": "singapore_citizen", "age": 35}

    prompt = build_chat_prompt(turn("What can I get?"), partial, [])

    assert "they have NOT finished the questionnaire" in prompt
    # Answered questions are not listed as outstanding...
    assert "Not answered yet" in prompt
    outstanding = prompt.split("Not answered yet")[1]
    assert "What is your age?" not in outstanding
    # ...and the blank ones are named as the person saw them.
    assert "What is your average gross monthly income from work?" in outstanding


def test_prompt_uses_whatever_has_been_filled_in() -> None:
    partial = {"citizenship_status": "singapore_citizen", "age": 35}

    prompt = build_chat_prompt(turn("What can I get?"), partial, [])

    assert "What is your age? 35" in prompt
    assert "Singapore Citizen" in prompt


def test_prompt_flags_a_completely_empty_questionnaire() -> None:
    prompt = build_chat_prompt(turn("What am I entitled to?"), {}, [])

    assert "they have NOT finished the questionnaire" in prompt
    assert "not run the check yet" in prompt


def test_no_unanswered_section_once_everything_is_filled(
    results: list[SchemeResult],
) -> None:
    prompt = build_chat_prompt(turn("What can I get?"), ANSWERS, results)

    assert "Not answered yet" not in prompt


def test_unanswered_questions_treats_blank_and_none_as_unanswered() -> None:
    labels = unanswered_questions({"citizenship_status": None, "age": "", "monthly_income": 1500})

    assert "What is your residency status?" in labels
    assert "What is your age?" in labels
    assert "What is your average gross monthly income from work?" not in labels


def test_system_prompt_asks_them_to_finish_the_questionnaire() -> None:
    assert "IF THE QUESTIONNAIRE IS NOT FINISHED" in SYSTEM_PROMPT
    assert "never say only" in SYSTEM_PROMPT
    # A blank answer must never be silently read as a zero or a "no".
    assert "never \\\ntreat a blank answer as a zero" in SYSTEM_PROMPT or (
        "treat a blank answer as a zero" in SYSTEM_PROMPT
    )


def test_prompt_works_before_any_results_exist() -> None:
    """The widget is usable before the questionnaire is submitted."""

    prompt = build_chat_prompt(turn("What can you help with?"), {}, [])

    assert "What can you help with?" in prompt
    # Falls back to every loaded rule's sources rather than none, so a
    # general question is answerable before the questionnaire is filled in.
    for rule in RULES:
        assert rule.support_go_where_url in prompt


# --- responses and degradation ----------------------------------------------


def test_uses_model_reply_when_available(results: list[SchemeResult]) -> None:
    client = StubClient({"reply": "ComCare is temporary help."})

    response = chat(turn("What is ComCare?"), ANSWERS, results, client)

    assert response.is_ai_generated is True
    assert response.reply == "ComCare is temporary help."


def test_no_client_still_explains_the_results(results: list[SchemeResult]) -> None:
    """ "Why am I eligible?" is answerable with no model at all.

    The evaluator already produced the reasons; a fallback that discards
    them answers a question about someone's money with a generic signpost
    while holding the real answer.
    """

    response = chat(turn("Why am I eligible?"), ANSWERS, results, None)

    assert response.is_ai_generated is False
    matched = [r for r in results if r.status is SchemeStatus.MATCHED]
    assert matched
    for result in matched:
        assert result.name in response.reply
        assert result.matched_facts[0] in response.reply
    assert "may be relevant" in response.reply
    # Still framed as pre-screening, and still routes onward.
    assert "not a decision" in response.reply
    assert COMCARE_HOTLINE in response.reply


def test_deterministic_reply_never_apologises_for_itself() -> None:
    """It comes from the rules engine, which is the authoritative part.

    Opening with "I can't answer in my own words" frames the more reliable
    answer as the degraded one, and talks about the machinery instead of
    the person's question.
    """

    results = evaluate_all(RULES, ANSWERS).results
    text = chat(turn("Why?"), ANSWERS, results, None).reply.lower()

    for phrase in (
        "i can't answer",
        "in my own words",
        "sorry",
        "unfortunately",
        "unavailable",
        "right now",
    ):
        assert phrase not in text, f"reply should not say {phrase!r}"


def test_deterministic_reply_is_laid_out_to_be_skimmed() -> None:
    results = evaluate_all(RULES, {**ANSWERS, "age": 22}).results

    reply = chat(turn("Why?"), {**ANSWERS, "age": 22}, results, None).reply

    # Sectioned, one scheme per line, with the criteria indented under it.
    assert "Based on your answers, these may be relevant:" in reply
    assert "These did not match the simplified check:" in reply
    assert "\n• " in reply
    assert "   ✓ " in reply


def test_unmatched_schemes_read_as_criteria_not_met(
    results: list[SchemeResult],
) -> None:
    """Guards a phrasing trap: the reasons listed are what was NOT met."""

    young = evaluate_all(RULES, {**ANSWERS, "age": 22}).results
    response = chat(turn("Why?"), {**ANSWERS, "age": 22}, young, None)

    assert "These did not match the simplified check:" in response.reply
    assert "— needs:" in response.reply


def test_fallback_without_results_is_the_generic_routing(
    results: list[SchemeResult],
) -> None:
    """With nothing to explain, it still points somewhere real."""

    response = chat(turn("Hello"), {}, [], None)

    assert response.reply == FALLBACK_REPLY


def test_unreachable_model_still_explains_the_results(
    results: list[SchemeResult],
) -> None:
    """An outage must not cost the person the answer the app already has."""

    response = chat(turn("Why do I match?"), ANSWERS, results, FailingClient())

    assert response.is_ai_generated is False
    assert "may be relevant" in response.reply
    assert any(r.name in response.reply for r in results)


def test_blank_reply_falls_back(results: list[SchemeResult]) -> None:
    response = chat(turn("Hello"), ANSWERS, results, StubClient({"reply": "  "}))

    assert response.is_ai_generated is False


def test_empty_conversation_does_not_call_the_model(
    results: list[SchemeResult],
) -> None:
    client = StubClient({"reply": "should not be used"})

    response = chat([], ANSWERS, results, client)

    assert client.user is None
    assert response.is_ai_generated is False


# --- the boundary between the two features ----------------------------------


def test_chatbot_and_explainer_keep_separate_context_policies(
    results: list[SchemeResult],
) -> None:
    """Guards against someone later "unifying" these two prompts.

    The chatbot may see the user's answers; the explainer may not. If a
    refactor collapses them, this fails.
    """

    from backend.app.features.scheme_navigator.explainer import build_prompt
    from backend.app.features.scheme_navigator.sources import snippets_for

    wis = next(r for r in results if r.rule_id == "workfare-income-supplement")

    chat_prompt = build_chat_prompt(turn("Why?"), ANSWERS, results)
    explain_prompt = build_prompt(wis, snippets_for(wis.rule_id))

    assert "1500" in chat_prompt, "chatbot is expected to see the answers"
    assert "1500" not in explain_prompt, "explainer must never see the answers"
