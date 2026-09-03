"""Loads the shared contract fixture and checks transaction_spread against it."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from backend.app.features.transaction_spread import daily_amounts, weekly_amounts

FIXTURE_PATH = (
    Path(__file__).resolve().parents[3] / "contracts" / "fixtures" / "transaction-week-split.json"
)


def _load_cases() -> list[dict]:
    with FIXTURE_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)["cases"]


def test_fixture_file_exists() -> None:
    assert FIXTURE_PATH.exists()


def test_every_case_matches_expected_weeks() -> None:
    for case in _load_cases():
        occurred_on = date.fromisoformat(case["occurredOn"])
        occurred_until = (
            date.fromisoformat(case["occurredUntil"]) if case["occurredUntil"] else None
        )
        result = weekly_amounts(case["amountCents"], occurred_on, occurred_until)
        expected = {date.fromisoformat(k): v for k, v in case["weeks"].items()}
        assert result == expected, f"case {case['name']!r} mismatched"


def test_every_case_sums_to_input_amount() -> None:
    for case in _load_cases():
        occurred_on = date.fromisoformat(case["occurredOn"])
        occurred_until = (
            date.fromisoformat(case["occurredUntil"]) if case["occurredUntil"] else None
        )
        result = weekly_amounts(case["amountCents"], occurred_on, occurred_until)
        assert sum(result.values()) == case["amountCents"]

        daily = daily_amounts(case["amountCents"], occurred_on, occurred_until)
        assert sum(cents for _, cents in daily) == case["amountCents"]


def test_daily_amounts_single_day() -> None:
    assert daily_amounts(999, date(2026, 1, 1), None) == [(date(2026, 1, 1), 999)]


def test_daily_amounts_remainder_on_earliest_days() -> None:
    result = daily_amounts(10, date(2026, 1, 1), date(2026, 1, 4))
    assert result == [
        (date(2026, 1, 1), 3),
        (date(2026, 1, 2), 3),
        (date(2026, 1, 3), 2),
        (date(2026, 1, 4), 2),
    ]
    assert sum(cents for _, cents in result) == 10
