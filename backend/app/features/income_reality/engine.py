"""Deterministic Income Reality calculations.

Pure, framework-independent functions: no FastAPI or Pydantic imports, so
this module is directly unit-testable with plain pytest and does not depend
on feature/01-foundation-input's app scaffold landing first (see
backend/app/features/income_reality/router.py for the API wrapper).

All monetary values are integer cents, matching the convention documented in
contracts/README.md. See contracts/schemas/income-reality.schema.json for the
shared request/response contract this module implements.
"""

from __future__ import annotations

from dataclasses import dataclass
from statistics import mean, pstdev

from .assumptions import IncomeAssumptions


@dataclass(frozen=True)
class PlatformEarning:
    platform: str
    gross_cents: int


@dataclass(frozen=True)
class WeeklyEntry:
    week_start: str  # ISO 8601 date, Monday of the week
    platform_earnings: tuple[PlatformEarning, ...] = ()
    work_costs_cents: int = 0
    essential_expenses_cents: int = 0
    recorded_cpf_cents: int | None = None


@dataclass(frozen=True)
class WeekBreakdown:
    week_start: str
    gross_earnings_cents: int
    platform_breakdown: tuple[PlatformEarning, ...]
    work_costs_cents: int
    cpf_cents: int
    net_income_cents: int
    essential_expenses_cents: int
    surplus_cents: int


@dataclass(frozen=True)
class TrendSummary:
    weeks_considered: int
    average_net_income_cents: int
    min_net_income_cents: int
    max_net_income_cents: int
    stdev_net_income_cents: int
    conservative_weekly_income_cents: int


def calculate_cpf_cents(gross_earnings_cents: int, apply_cpf: bool, cpf_rate_bps: int) -> int:
    """Simplified flat-rate CPF/MediSave estimate, round-half-up on integer cents."""
    if not apply_cpf or cpf_rate_bps <= 0:
        return 0
    return (gross_earnings_cents * cpf_rate_bps + 5000) // 10000


def calculate_week_breakdown(
    entry: WeeklyEntry, *, apply_cpf: bool, cpf_rate_bps: int
) -> WeekBreakdown:
    """Net income and surplus for a single week.

    Negative results are intentionally not floored to zero: a week where
    costs exceed earnings, or essential expenses exceed net income, must be
    visible as a true deficit so every displayed value stays traceable to
    the underlying formula.
    """
    gross_earnings_cents = sum(p.gross_cents for p in entry.platform_earnings)
    cpf_cents = (
        entry.recorded_cpf_cents
        if entry.recorded_cpf_cents is not None
        else calculate_cpf_cents(gross_earnings_cents, apply_cpf, cpf_rate_bps)
    )
    net_income_cents = gross_earnings_cents - entry.work_costs_cents - cpf_cents
    surplus_cents = net_income_cents - entry.essential_expenses_cents
    return WeekBreakdown(
        week_start=entry.week_start,
        gross_earnings_cents=gross_earnings_cents,
        platform_breakdown=entry.platform_earnings,
        work_costs_cents=entry.work_costs_cents,
        cpf_cents=cpf_cents,
        net_income_cents=net_income_cents,
        essential_expenses_cents=entry.essential_expenses_cents,
        surplus_cents=surplus_cents,
    )


def calculate_recent_trend(breakdowns: list[WeekBreakdown]) -> TrendSummary:
    """Recent-week trend, including a conservative income figure a savings
    recommendation can safely anchor to.

    conservative_weekly_income_cents = max(0, average - population_stdev)
    over the supplied weeks' net income. It is one transparent formula, not
    a black box, and is never negative even when the average is depressed
    by a deficit week.
    """
    if not breakdowns:
        raise ValueError("calculate_recent_trend requires at least one week")

    net_incomes = [b.net_income_cents for b in breakdowns]
    average = mean(net_incomes)
    stdev = pstdev(net_incomes) if len(net_incomes) > 1 else 0.0
    conservative = max(0, round(average - stdev))
    return TrendSummary(
        weeks_considered=len(breakdowns),
        average_net_income_cents=round(average),
        min_net_income_cents=min(net_incomes),
        max_net_income_cents=max(net_incomes),
        stdev_net_income_cents=round(stdev),
        conservative_weekly_income_cents=conservative,
    )


def calculate_income_reality(
    weeks: list[WeeklyEntry], assumptions: IncomeAssumptions
) -> tuple[list[WeekBreakdown], TrendSummary]:
    breakdowns = [
        calculate_week_breakdown(
            week, apply_cpf=assumptions.apply_cpf, cpf_rate_bps=assumptions.cpf_rate_bps
        )
        for week in weeks
    ]
    trend = calculate_recent_trend(breakdowns)
    return breakdowns, trend
