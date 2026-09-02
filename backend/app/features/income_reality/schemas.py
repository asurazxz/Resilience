"""Pydantic request/response schemas for the Income Reality API.

Mirrors contracts/schemas/income-reality.schema.json - keep the two in sync
when either changes. Kept separate from engine.py so the deterministic
calculations stay importable without Pydantic/FastAPI installed.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from .assumptions import DEFAULT_ASSUMPTIONS


class PlatformEarningIn(BaseModel):
    platform: str = Field(min_length=1)
    gross_cents: int = Field(ge=0)


class WeeklyEntryIn(BaseModel):
    week_start: str = Field(description="ISO 8601 date, Monday of the week")
    platform_earnings: list[PlatformEarningIn] = Field(default_factory=list)
    work_costs_cents: int = Field(default=0, ge=0)
    essential_expenses_cents: int = Field(default=0, ge=0)


class AssumptionsIn(BaseModel):
    apply_cpf: bool = DEFAULT_ASSUMPTIONS.apply_cpf
    cpf_rate_bps: int = Field(default=DEFAULT_ASSUMPTIONS.cpf_rate_bps, ge=0, le=10000)


class IncomeRealityRequest(BaseModel):
    weeks: list[WeeklyEntryIn] = Field(min_length=1, max_length=52)
    assumptions: AssumptionsIn = Field(default_factory=AssumptionsIn)


class PlatformEarningOut(BaseModel):
    platform: str
    gross_cents: int


class WeekBreakdownOut(BaseModel):
    week_start: str
    gross_earnings_cents: int
    platform_breakdown: list[PlatformEarningOut]
    work_costs_cents: int
    cpf_cents: int
    net_income_cents: int
    essential_expenses_cents: int
    surplus_cents: int


class TrendSummaryOut(BaseModel):
    weeks_considered: int
    average_net_income_cents: int
    min_net_income_cents: int
    max_net_income_cents: int
    stdev_net_income_cents: int
    conservative_weekly_income_cents: int


class IncomeRealityResponse(BaseModel):
    weeks: list[WeekBreakdownOut]
    trend: TrendSummaryOut
    assumptions_applied: AssumptionsIn
