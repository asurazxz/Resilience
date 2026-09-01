"""Unit tests for the deterministic Income Reality engine.

Pure pytest + the engine module - no FastAPI, Pydantic, or database
dependency, so these are runnable as soon as pytest is available, without
waiting on feature/01-foundation-input's app scaffold.

Written to satisfy the acceptance checks in documentation/initial-scaffold.md:
multiple platforms, zero income, costs exceeding earnings, optional CPF
deductions, and multiple weeks.
"""

from app.features.income_reality.assumptions import IncomeAssumptions
from app.features.income_reality.engine import (
    PlatformEarning,
    WeeklyEntry,
    calculate_income_reality,
    calculate_recent_trend,
    calculate_week_breakdown,
)

WITH_CPF = IncomeAssumptions(apply_cpf=True, cpf_rate_bps=800)


def _entry(week_start, platforms, work_costs=0, essential=0):
    return WeeklyEntry(
        week_start=week_start,
        platform_earnings=tuple(
            PlatformEarning(platform=platform, gross_cents=cents) for platform, cents in platforms
        ),
        work_costs_cents=work_costs,
        essential_expenses_cents=essential,
    )


def test_multiple_platforms_sum_into_gross_earnings():
    entry = _entry(
        "2026-08-24", [("Grab", 45000), ("Foodpanda", 12000)], work_costs=8000, essential=30000
    )
    breakdown = calculate_week_breakdown(entry, apply_cpf=False, cpf_rate_bps=0)

    assert breakdown.gross_earnings_cents == 57000
    assert len(breakdown.platform_breakdown) == 2
    assert breakdown.net_income_cents == 49000
    assert breakdown.surplus_cents == 19000


def test_zero_income_week_reports_true_deficit():
    entry = _entry("2026-08-31", [], work_costs=0, essential=10000)
    breakdown = calculate_week_breakdown(entry, apply_cpf=False, cpf_rate_bps=0)

    assert breakdown.gross_earnings_cents == 0
    assert breakdown.net_income_cents == 0
    assert breakdown.surplus_cents == -10000


def test_costs_exceeding_earnings_is_not_floored_to_zero():
    entry = _entry("2026-08-24", [("Grab", 5000)], work_costs=9000, essential=1000)
    breakdown = calculate_week_breakdown(entry, apply_cpf=False, cpf_rate_bps=0)

    assert breakdown.net_income_cents == -4000
    assert breakdown.surplus_cents == -5000


def test_cpf_toggle_off_applies_no_deduction():
    entry = _entry("2026-08-24", [("Grab", 100000)])
    breakdown = calculate_week_breakdown(entry, apply_cpf=False, cpf_rate_bps=800)

    assert breakdown.cpf_cents == 0
    assert breakdown.net_income_cents == 100000


def test_cpf_toggle_on_deducts_the_configured_flat_rate():
    entry = _entry("2026-08-24", [("Grab", 100000)])
    breakdown = calculate_week_breakdown(entry, apply_cpf=True, cpf_rate_bps=800)

    assert breakdown.cpf_cents == 8000  # 8% of 100000
    assert breakdown.net_income_cents == 92000


def test_cpf_rate_of_zero_bps_is_a_no_op_even_when_enabled():
    entry = _entry("2026-08-24", [("Grab", 100000)])
    breakdown = calculate_week_breakdown(entry, apply_cpf=True, cpf_rate_bps=0)

    assert breakdown.cpf_cents == 0


def test_single_week_trend_has_zero_stdev_and_conservative_equals_average():
    entry = _entry("2026-08-24", [("Grab", 50000)])
    breakdown = calculate_week_breakdown(entry, apply_cpf=False, cpf_rate_bps=0)
    trend = calculate_recent_trend([breakdown])

    assert trend.weeks_considered == 1
    assert trend.stdev_net_income_cents == 0
    assert trend.conservative_weekly_income_cents == trend.average_net_income_cents == 50000


def test_multi_week_trend_computes_spread_and_a_conservative_figure_below_average():
    entries = [
        _entry("2026-08-03", [("Grab", 20000)]),
        _entry("2026-08-10", [("Grab", 80000)]),
        _entry("2026-08-17", [("Grab", 50000)]),
    ]
    breakdowns = [calculate_week_breakdown(e, apply_cpf=False, cpf_rate_bps=0) for e in entries]
    trend = calculate_recent_trend(breakdowns)

    assert trend.weeks_considered == 3
    assert trend.min_net_income_cents == 20000
    assert trend.max_net_income_cents == 80000
    assert 0 <= trend.conservative_weekly_income_cents < trend.average_net_income_cents


def test_conservative_income_never_goes_negative_even_with_a_deficit_week():
    entries = [
        _entry("2026-08-03", [("Grab", 10000)], work_costs=15000),  # net -5000
        _entry("2026-08-10", [("Grab", 10000)]),  # net 10000
    ]
    breakdowns = [calculate_week_breakdown(e, apply_cpf=False, cpf_rate_bps=0) for e in entries]
    trend = calculate_recent_trend(breakdowns)

    assert trend.conservative_weekly_income_cents >= 0


def test_calculate_income_reality_end_to_end_with_multiple_weeks_and_cpf():
    entries = [
        _entry(
            "2026-08-03",
            [("Grab", 40000), ("Lalamove", 5000)],
            work_costs=4000,
            essential=25000,
        ),
        _entry("2026-08-10", [("Grab", 30000)], work_costs=3000, essential=25000),
    ]

    breakdowns, trend = calculate_income_reality(entries, WITH_CPF)

    assert len(breakdowns) == 2
    assert breakdowns[0].gross_earnings_cents == 45000
    assert breakdowns[0].cpf_cents == 3600  # 8% of 45000
    assert breakdowns[0].net_income_cents == 45000 - 4000 - 3600
    assert trend.weeks_considered == 2
