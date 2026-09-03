"""Tests for the deterministic scheme evaluator.

Covers matched, not-matched, missing-information, and boundary-value cases
per .agent/RULES.md and documentation/initial-scaffold.md acceptance checks.
"""

from __future__ import annotations

from datetime import date

import pytest

from backend.app.features.scheme_navigator.evaluator import evaluate_all, evaluate_rule
from backend.app.features.scheme_navigator.rules import RULES
from backend.app.features.scheme_navigator.schemas import Condition, SchemeRule, SchemeStatus

WIS = next(rule for rule in RULES if rule.id == "workfare-income-supplement")
COMCARE = next(rule for rule in RULES if rule.id == "comcare-short-to-medium-term-assistance")
SKILLSFUTURE = next(rule for rule in RULES if rule.id == "skillsfuture-credit")
CDC = next(rule for rule in RULES if rule.id == "cdc-vouchers")


def wis_answers(**overrides: object) -> dict[str, object]:
    base = {
        "citizenship_status": "singapore_citizen",
        "age": 35,
        "monthly_income": 1500,
        "owns_more_than_one_property": False,
        "residence_annual_value": 10000,
        "spouse_annual_income": 0,
    }
    base.update(overrides)
    return base


class TestMatched:
    def test_wis_matches_when_every_condition_holds(self) -> None:
        result = evaluate_rule(WIS, wis_answers())

        assert result.status == SchemeStatus.MATCHED
        assert result.unmatched_reasons == []
        assert result.missing_fields == []
        assert len(result.matched_facts) == len(WIS.conditions)

    def test_cdc_matches_singapore_citizen(self) -> None:
        result = evaluate_rule(CDC, {"citizenship_status": "singapore_citizen"})

        assert result.status == SchemeStatus.MATCHED


class TestNotMatched:
    def test_wis_not_matched_when_income_too_low(self) -> None:
        result = evaluate_rule(WIS, wis_answers(monthly_income=300))

        assert result.status == SchemeStatus.NOT_MATCHED
        assert any("above $500" in reason for reason in result.unmatched_reasons)

    def test_wis_not_matched_when_income_too_high(self) -> None:
        result = evaluate_rule(WIS, wis_answers(monthly_income=5000))

        assert result.status == SchemeStatus.NOT_MATCHED

    def test_wis_not_matched_when_under_age(self) -> None:
        result = evaluate_rule(WIS, wis_answers(age=25))

        assert result.status == SchemeStatus.NOT_MATCHED
        assert any("30 or above" in reason for reason in result.unmatched_reasons)

    def test_wis_not_matched_when_owns_multiple_properties(self) -> None:
        result = evaluate_rule(WIS, wis_answers(owns_more_than_one_property=True))

        assert result.status == SchemeStatus.NOT_MATCHED

    def test_skillsfuture_not_matched_for_non_citizen(self) -> None:
        result = evaluate_rule(
            SKILLSFUTURE,
            {"citizenship_status": "permanent_resident", "age": 30},
        )

        assert result.status == SchemeStatus.NOT_MATCHED

    def test_comcare_not_matched_without_hardship(self) -> None:
        result = evaluate_rule(
            COMCARE,
            {
                "citizenship_status": "singapore_citizen",
                "household_income_per_capita": 400,
                "experiencing_financial_hardship": False,
            },
        )

        assert result.status == SchemeStatus.NOT_MATCHED


class TestMissingInformation:
    def test_wis_missing_information_when_answers_incomplete(self) -> None:
        result = evaluate_rule(WIS, {"citizenship_status": "singapore_citizen"})

        assert result.status == SchemeStatus.MISSING_INFORMATION
        assert "age" in result.missing_fields
        assert "monthly_income" in result.missing_fields
        # Nothing should be reported as matched or unmatched while incomplete.
        assert result.matched_facts == []
        assert result.unmatched_reasons == []

    def test_missing_information_takes_priority_over_a_false_field(self) -> None:
        # age is present and would fail on its own, but monthly_income is
        # still missing, so the rule must not be judged "not matched" yet.
        result = evaluate_rule(WIS, {"age": 20})

        assert result.status == SchemeStatus.MISSING_INFORMATION

    def test_none_value_counts_as_missing(self) -> None:
        result = evaluate_rule(WIS, wis_answers(monthly_income=None))

        assert result.status == SchemeStatus.MISSING_INFORMATION
        assert "monthly_income" in result.missing_fields

    def test_empty_answers_reports_every_field_missing(self) -> None:
        result = evaluate_rule(CDC, {})

        assert result.status == SchemeStatus.MISSING_INFORMATION
        assert result.missing_fields == ["citizenship_status"]


class TestBoundaryValues:
    @pytest.mark.parametrize(
        ("income", "expected_status"),
        [
            (500, SchemeStatus.NOT_MATCHED),  # exclusive lower bound
            (501, SchemeStatus.MATCHED),
            (3000, SchemeStatus.MATCHED),  # inclusive upper bound
            (3001, SchemeStatus.NOT_MATCHED),
        ],
    )
    def test_wis_income_boundaries(self, income: int, expected_status: SchemeStatus) -> None:
        result = evaluate_rule(WIS, wis_answers(monthly_income=income))

        assert result.status == expected_status

    @pytest.mark.parametrize(
        ("age", "expected_status"),
        [
            (29, SchemeStatus.NOT_MATCHED),
            (30, SchemeStatus.MATCHED),
        ],
    )
    def test_wis_age_boundary(self, age: int, expected_status: SchemeStatus) -> None:
        result = evaluate_rule(WIS, wis_answers(age=age))

        assert result.status == expected_status

    @pytest.mark.parametrize(
        ("annual_value", "expected_status"),
        [
            (21000, SchemeStatus.MATCHED),  # inclusive upper bound
            (21001, SchemeStatus.NOT_MATCHED),
        ],
    )
    def test_wis_residence_annual_value_boundary(
        self, annual_value: int, expected_status: SchemeStatus
    ) -> None:
        result = evaluate_rule(WIS, wis_answers(residence_annual_value=annual_value))

        assert result.status == expected_status


class TestEvaluateAll:
    def test_returns_one_result_per_rule(self) -> None:
        response = evaluate_all(RULES, {})

        assert len(response.results) == len(RULES)
        assert {result.rule_id for result in response.results} == {rule.id for rule in RULES}

    def test_generated_at_is_populated(self) -> None:
        response = evaluate_all(RULES, {})

        assert response.generated_at is not None


class TestOperatorCoverage:
    """A minimal synthetic rule exercising every supported operator, kept
    independent of the real scheme data above so operator behaviour is
    tested directly rather than incidentally."""

    def _rule_with(self, operator: str, value: object) -> SchemeRule:
        return SchemeRule(
            id="synthetic",
            name="Synthetic",
            agency="Test",
            official_source_url="https://example.gov.sg",
            application_url="https://example.gov.sg",
            effective_date=date(2026, 1, 1),
            last_reviewed_date=date(2026, 1, 1),
            rule_version="1.0.0",
            summary="Synthetic rule for operator tests.",
            simplified_note="Test-only rule.",
            conditions=[
                Condition(field="age", operator=operator, value=value, description="check")
            ],
        )

    @pytest.mark.parametrize(
        ("operator", "target", "answer", "expected_matched"),
        [
            ("eq", 5, 5, True),
            ("eq", 5, 6, False),
            ("neq", 5, 6, True),
            ("neq", 5, 5, False),
            ("gt", 5, 6, True),
            ("gt", 5, 5, False),
            ("lt", 5, 4, True),
            ("lt", 5, 5, False),
            ("in", [1, 2, 3], 2, True),
            ("in", [1, 2, 3], 9, False),
        ],
    )
    def test_operator(
        self, operator: str, target: object, answer: object, expected_matched: bool
    ) -> None:
        rule = self._rule_with(operator, target)
        result = evaluate_rule(rule, {"age": answer})

        assert (result.status == SchemeStatus.MATCHED) is expected_matched


class TestAnswerCoercion:
    """Answers arrive as JSON from a browser; the evaluator must never crash
    on a value of the wrong shape, and must ask again rather than guess."""

    def test_numeric_string_is_accepted_as_a_number(self) -> None:
        typed = evaluate_rule(WIS, wis_answers(age=35))
        as_text = evaluate_rule(WIS, wis_answers(age="35"))

        assert as_text.status == typed.status
        assert as_text.missing_fields == []

    def test_unparseable_number_counts_as_unanswered(self) -> None:
        result = evaluate_rule(WIS, wis_answers(age="thirty-five"))

        assert result.status == SchemeStatus.MISSING_INFORMATION
        assert "age" in result.missing_fields

    def test_list_where_a_select_belongs_counts_as_unanswered(self) -> None:
        result = evaluate_rule(WIS, wis_answers(citizenship_status=["singapore_citizen"]))

        assert result.status == SchemeStatus.MISSING_INFORMATION
        assert "citizenship_status" in result.missing_fields

    def test_select_value_outside_the_options_counts_as_unanswered(self) -> None:
        result = evaluate_rule(WIS, wis_answers(citizenship_status="martian"))

        assert result.status == SchemeStatus.MISSING_INFORMATION
        assert "citizenship_status" in result.missing_fields

    def test_yes_where_a_boolean_belongs_counts_as_unanswered(self) -> None:
        result = evaluate_rule(WIS, wis_answers(owns_more_than_one_property="yes"))

        assert result.status == SchemeStatus.MISSING_INFORMATION
        assert "owns_more_than_one_property" in result.missing_fields

    def test_unknown_keys_are_dropped(self) -> None:
        result = evaluate_rule(WIS, wis_answers(not_a_real_field={"nested": True}))

        assert result.status == evaluate_rule(WIS, wis_answers()).status

    def test_evaluate_all_never_raises_on_hostile_answers(self) -> None:
        response = evaluate_all(RULES, {"age": {"a": 1}, "citizenship_status": 7, "junk": None})

        assert all(result.status == SchemeStatus.MISSING_INFORMATION for result in response.results)
