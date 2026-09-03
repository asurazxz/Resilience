"""Pydantic contracts for the Scheme Navigator.

These models are the shared shape between the deterministic evaluator, the
FastAPI routes, and the frontend questionnaire. Keeping them framework-free
(no FastAPI imports) lets the evaluator be unit-tested in isolation.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

FieldType = Literal["number", "boolean", "select", "date"]
Operator = Literal["eq", "neq", "gte", "lte", "gt", "lt", "in"]

MAX_ANSWER_LENGTH = 200


def _validate_answers(answers: dict[str, Any]) -> dict[str, Any]:
    """Keep answers to bounded scalars, whatever the client sends.

    Answers reach a model prompt via the chatbot, so an unbounded blob or a
    nested structure is refused at the boundary rather than trimmed later.
    """

    for key, value in answers.items():
        if value is None or isinstance(value, bool | int | float):
            continue
        if isinstance(value, str):
            if len(value) > MAX_ANSWER_LENGTH:
                raise ValueError(
                    f"Answer '{key}' must be {MAX_ANSWER_LENGTH} characters or fewer."
                )
            continue
        raise ValueError(f"Answer '{key}' must be a single text, number, or true/false value.")
    return answers


class SelectOption(BaseModel):
    value: str
    label: str


class QuestionnaireField(BaseModel):
    """One prompt shown to the user. Derived from whichever scheme rules
    actually reference it, not hand-written per scheme."""

    key: str
    label: str
    field_type: FieldType
    help_text: str | None = None
    unit: str | None = None
    options: list[SelectOption] | None = None
    min_value: float | None = None
    max_value: float | None = None


class Condition(BaseModel):
    """One eligibility check within a scheme rule, e.g. age >= 30."""

    field: str
    operator: Operator
    value: Any
    description: str  # human-readable clause used to render matched/unmatched facts


class SchemeRule(BaseModel):
    """A single versioned support-scheme rule.

    Rules are prototype-simplified approximations of real Singapore schemes
    for demonstration purposes. They are not a substitute for official
    eligibility confirmation, which is why every rule carries a source link
    and a review date, and every result is framed as pre-screening.
    """

    id: str
    name: str
    agency: str
    official_source_url: str
    application_url: str
    # The scheme's canonical page on SupportGoWhere, the government's own
    # aggregator. Kept alongside the agency URL because it is where the
    # curated snippets came from and where a person can check the current
    # position for themselves.
    #
    # Defaulted so synthetic rules in tests stay readable; every real rule
    # must set it, which ``test_every_rule_links_to_support_go_where``
    # enforces.
    support_go_where_url: str = ""
    effective_date: date
    last_reviewed_date: date
    rule_version: str
    summary: str
    simplified_note: str
    conditions: list[Condition]


class SchemeStatus(StrEnum):
    MATCHED = "matched"
    NOT_MATCHED = "not_matched"
    MISSING_INFORMATION = "missing_information"


class SchemeResult(BaseModel):
    rule_id: str
    name: str
    agency: str
    status: SchemeStatus
    matched_facts: list[str] = Field(default_factory=list)
    unmatched_reasons: list[str] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)
    official_source_url: str
    application_url: str
    last_reviewed_date: date
    simplified_note: str


class EvaluationRequest(BaseModel):
    answers: dict[str, Any] = Field(default_factory=dict, max_length=32)

    _check_answers = field_validator("answers")(_validate_answers)


class EvaluationResponse(BaseModel):
    generated_at: datetime
    results: list[SchemeResult]


class SourceSnippet(BaseModel):
    """One piece of curated official material the explainer may draw on."""

    text: str
    source_url: str
    retrieved_on: date


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1_500)


class ChatRequest(BaseModel):
    """A chatbot turn.

    Unlike the explainer, this deliberately carries the user's ``answers``:
    the assistant is expected to field questions like "why didn't I match
    WIS?", which cannot be answered without them. That is a conscious
    privacy trade -- see documentation/features/scheme-navigator.md.
    """

    messages: list[ChatMessage] = Field(default_factory=list, max_length=12)
    answers: dict[str, Any] = Field(default_factory=dict, max_length=32)
    results: list[SchemeResult] = Field(default_factory=list, max_length=10)

    _check_answers = field_validator("answers")(_validate_answers)


class ChatResponse(BaseModel):
    reply: str
    # False when the deterministic fallback answered, so the UI never
    # presents a canned reply as though a model wrote it.
    is_ai_generated: bool
    generated_at: datetime


class ExplanationRequest(BaseModel):
    """Asks for a plain-language explanation of an already-decided result.

    The caller sends back a ``SchemeResult`` the evaluator produced. The
    explainer never re-derives the status, so the request carries the
    outcome rather than the answers that led to it.
    """

    rule_id: str = Field(min_length=1, max_length=100)
    answers: dict[str, Any] = Field(default_factory=dict, max_length=32)


class ExplanationResponse(BaseModel):
    summary: str
    next_steps: list[str] = Field(default_factory=list)
    source_urls: list[str] = Field(default_factory=list)
    # False when the deterministic fallback produced this text, so the UI can
    # label it honestly instead of implying an AI wrote it.
    is_ai_generated: bool
    generated_at: datetime
