"""Tests for deriving the questionnaire from loaded scheme rules."""

from __future__ import annotations

import pytest

from app.features.scheme_navigator.questionnaire import build_questionnaire
from app.features.scheme_navigator.rules import RULES
from app.features.scheme_navigator.schemas import Condition, SchemeRule
from datetime import date


def _rule(field_keys: list[str]) -> SchemeRule:
    return SchemeRule(
        id="synthetic",
        name="Synthetic",
        agency="Test",
        official_source_url="https://example.gov.sg",
        application_url="https://example.gov.sg",
        effective_date=date(2026, 1, 1),
        last_reviewed_date=date(2026, 1, 1),
        rule_version="1.0.0",
        summary="Synthetic rule for questionnaire tests.",
        simplified_note="Test-only rule.",
        conditions=[
            Condition(field=key, operator="eq", value=True, description=key)
            for key in field_keys
        ],
    )


class TestBuildQuestionnaire:
    def test_deduplicates_fields_shared_across_rules(self) -> None:
        rules = [_rule(["citizenship_status", "age"]), _rule(["citizenship_status"])]

        fields = build_questionnaire(rules)

        keys = [field.key for field in fields]
        assert keys.count("citizenship_status") == 1
        assert set(keys) == {"citizenship_status", "age"}

    def test_only_referenced_fields_are_included(self) -> None:
        fields = build_questionnaire([_rule(["age"])])

        assert [field.key for field in fields] == ["age"]

    def test_real_rules_produce_the_full_expected_field_set(self) -> None:
        fields = build_questionnaire(RULES)

        assert {field.key for field in fields} == {
            "citizenship_status",
            "age",
            "monthly_income",
            "owns_more_than_one_property",
            "residence_annual_value",
            "spouse_annual_income",
            "household_income_per_capita",
            "experiencing_financial_hardship",
        }

    def test_unknown_field_raises(self) -> None:
        with pytest.raises(KeyError):
            build_questionnaire([_rule(["not_a_real_field"])])

    def test_preferred_fields_come_first_in_stable_order(self) -> None:
        fields = build_questionnaire(RULES)
        keys = [field.key for field in fields]

        assert keys.index("citizenship_status") < keys.index("age")
        assert keys.index("age") < keys.index("monthly_income")
