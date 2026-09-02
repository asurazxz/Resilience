"""Deterministic evaluation of scheme rules against user answers.

No AI or network call participates in this module. Given the same rules and
the same answers, the result is always the same, which is what makes it
testable and auditable. An LLM may later explain a ``SchemeResult`` in plain
language, but it never produces one.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Callable

from app.features.scheme_navigator.schemas import (
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


def _condition_passes(condition: Condition, answer: object) -> bool:
    comparator = _OPERATORS[condition.operator]
    return bool(comparator(answer, condition.value))


def evaluate_rule(rule: SchemeRule, answers: dict[str, object]) -> SchemeResult:
    """Evaluate a single rule against the answers collected so far.

    Missing information always takes priority over a false result: a
    condition is only ever judged "not matched" once every field it needs
    has actually been answered.
    """

    missing_fields = sorted(
        {
            condition.field
            for condition in rule.conditions
            if condition.field not in answers or answers[condition.field] is None
        }
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
