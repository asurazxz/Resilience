"""Verifies the committed contracts/fixtures/income-reality/*.json examples
actually match engine.py's output.

The fixtures were authored by hand against the engine's documented formulas
(no Python interpreter was available while drafting this feature - see
documentation/features/income-reality.md limitations). This test is the
gate that catches any arithmetic mistake in those fixtures the first time
pytest runs, rather than silently shipping a wrong worked example to the
frontend and to other workstreams that consume this contract.
"""

import json
from pathlib import Path

from app.features.income_reality.assumptions import IncomeAssumptions
from app.features.income_reality.engine import (
    PlatformEarning,
    WeeklyEntry,
    calculate_income_reality,
)

FIXTURES_DIR = Path(__file__).resolve().parents[4] / "contracts" / "fixtures" / "income-reality"
SCENARIOS = ["typical-week", "zero-income-week", "multi-week-deficit"]


def _load(name: str) -> dict:
    return json.loads((FIXTURES_DIR / name).read_text())


def _request_to_engine_args(request: dict) -> tuple[list[WeeklyEntry], IncomeAssumptions]:
    weeks = [
        WeeklyEntry(
            week_start=week["week_start"],
            platform_earnings=tuple(
                PlatformEarning(platform=p["platform"], gross_cents=p["gross_cents"])
                for p in week.get("platform_earnings", [])
            ),
            work_costs_cents=week.get("work_costs_cents", 0),
            essential_expenses_cents=week.get("essential_expenses_cents", 0),
        )
        for week in request["weeks"]
    ]
    assumptions_in = request.get("assumptions", {})
    assumptions = IncomeAssumptions(
        apply_cpf=assumptions_in.get("apply_cpf", False),
        cpf_rate_bps=assumptions_in.get("cpf_rate_bps", 800),
    )
    return weeks, assumptions


def test_every_fixture_response_matches_the_engine_output():
    for scenario in SCENARIOS:
        request = _load(f"{scenario}-request.json")
        expected_response = _load(f"{scenario}-response.json")

        weeks, assumptions = _request_to_engine_args(request)
        breakdowns, trend = calculate_income_reality(weeks, assumptions)

        actual_weeks = [
            {
                "week_start": b.week_start,
                "gross_earnings_cents": b.gross_earnings_cents,
                "platform_breakdown": [
                    {"platform": p.platform, "gross_cents": p.gross_cents}
                    for p in b.platform_breakdown
                ],
                "work_costs_cents": b.work_costs_cents,
                "cpf_cents": b.cpf_cents,
                "net_income_cents": b.net_income_cents,
                "essential_expenses_cents": b.essential_expenses_cents,
                "surplus_cents": b.surplus_cents,
            }
            for b in breakdowns
        ]
        actual_trend = {
            "weeks_considered": trend.weeks_considered,
            "average_net_income_cents": trend.average_net_income_cents,
            "min_net_income_cents": trend.min_net_income_cents,
            "max_net_income_cents": trend.max_net_income_cents,
            "stdev_net_income_cents": trend.stdev_net_income_cents,
            "conservative_weekly_income_cents": trend.conservative_weekly_income_cents,
        }

        assert actual_weeks == expected_response["weeks"], scenario
        assert actual_trend == expected_response["trend"], scenario
