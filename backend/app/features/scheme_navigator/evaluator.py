"""Deterministic evaluation of scheme rules against user answers.

No AI or network call participates in this module. Given the same rules and
the same answers, the result is always the same, which is what makes it
testable and auditable. An LLM may later explain a ``SchemeResult`` in plain
language, but it never produces one.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, date, datetime

from .fields import FIELD_REGISTRY
from .schemas import (
    Condition,
    EvaluationResponse,
    Operator,
    SchemeResult,
    SchemeRule,
    SchemeStatus,
)

_OPERATORS: dict[Operator, Callable[[object, object], bool]] = {
    "eq": lambda answer, target: answer == target,
    "neq": lambda answer, target: answer != target,
    "gte": lambda answer, target: answer >= target,
    "lte": lambda answer, target: answer <= target,
    "gt": lambda answer, target: answer > target,
    "lt": lambda answer, target: answer < target,
    "in": lambda answer, target: answer in target,
}

_UNANSWERED = object()


def _coerce_number(value: object) -> object:
    if isinstance(value, bool):
        return _UNANSWERED
    if isinstance(value, int | float):
        return value
    if isinstance(value, str):
        text = value.strip()
        try:
            return int(text)
        except ValueError:
            pass
        try:
            return float(text)
        except ValueError:
            return _UNANSWERED
    return _UNANSWERED


def _coerce_date(value: object) -> object:
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value.strip())
        except ValueError:
            return _UNANSWERED
    return _UNANSWERED


def _coerce(field_key: str, value: object) -> object:
    """Return the typed answer, or ``_UNANSWERED`` when it cannot be used.

    An answer the questionnaire could never have produced -- a list where a
    number belongs, ``"yes"`` where a boolean belongs -- counts as unanswered
    rather than as a failed condition, so the user is asked again instead of
    being told they do not qualify.
    """

    field = FIELD_REGISTRY.get(field_key)
    if field is None or value is None:
        return _UNANSWERED
    if field.field_type == "number":
        return _coerce_number(value)
    if field.field_type == "boolean":
        return value if isinstance(value, bool) else _UNANSWERED
    if field.field_type == "select":
        allowed = {option.value for option in field.options or []}
        return value if isinstance(value, str) and value in allowed else _UNANSWERED
    if field.field_type == "date":
        return _coerce_date(value)
    return _UNANSWERED


def coerce_answers(answers: dict[str, object]) -> dict[str, object]:
    """Drop unknown keys and anything that does not fit its field's type."""

    coerced: dict[str, object] = {}
    for key, value in answers.items():
        typed = _coerce(key, value)
        if typed is not _UNANSWERED:
            coerced[key] = typed
    return coerced


def _condition_passes(condition: Condition, answer: object) -> bool:
    comparator = _OPERATORS[condition.operator]
    try:
        return bool(comparator(answer, condition.value))
    except TypeError:
        # A rule compared incomparable types; never a match, never a crash.
        return False


def evaluate_rule(rule: SchemeRule, answers: dict[str, object]) -> SchemeResult:
    """Evaluate a single rule against the answers collected so far.

    Missing information always takes priority over a false result: a
    condition is only ever judged "not matched" once every field it needs
    has actually been answered, with an answer of the type that field
    expects.
    """

    answers = coerce_answers(answers)
    missing_fields = sorted(
        {condition.field for condition in rule.conditions if condition.field not in answers}
    )

    if missing_fields:
        return SchemeResult(
            rule_id=rule.id,
            name=rule.name,
            agency=rule.agency,
            status=SchemeStatus.MISSING_INFORMATION,
            missing_fields=missing_fields,
            official_source_url=rule.official_source_url,
            application_url=rule.application_url,
            last_reviewed_date=rule.last_reviewed_date,
            simplified_note=rule.simplified_note,
        )

    matched_facts: list[str] = []
    unmatched_reasons: list[str] = []
    for condition in rule.conditions:
        answer = answers[condition.field]
        if _condition_passes(condition, answer):
            matched_facts.append(condition.description)
        else:
            unmatched_reasons.append(condition.description)

    status = SchemeStatus.MATCHED if not unmatched_reasons else SchemeStatus.NOT_MATCHED

    return SchemeResult(
        rule_id=rule.id,
        name=rule.name,
        agency=rule.agency,
        status=status,
        matched_facts=matched_facts,
        unmatched_reasons=unmatched_reasons,
        official_source_url=rule.official_source_url,
        application_url=rule.application_url,
        last_reviewed_date=rule.last_reviewed_date,
        simplified_note=rule.simplified_note,
    )


def evaluate_all(rules: list[SchemeRule], answers: dict[str, object]) -> EvaluationResponse:
    results = [evaluate_rule(rule, answers) for rule in rules]
    return EvaluationResponse(generated_at=datetime.now(UTC), results=results)
