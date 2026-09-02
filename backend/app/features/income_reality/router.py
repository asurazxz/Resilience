"""Income Reality API router.

Not mounted anywhere yet: feature/01-foundation-input owns app/main.py and
the route composition in app/api/ (see backend/README.md). Whoever wires
main.py should do:

    from app.features.income_reality.router import router as income_reality_router
    app.include_router(income_reality_router, prefix="/income-reality", tags=["income-reality"])

This router has no knowledge of its own mount prefix or of persistence -
it takes a week's entries directly in the request body (see
documentation/features/income-reality.md for why) and delegates every
calculation to engine.py, which stays pure and framework-independent.
"""

from __future__ import annotations

from fastapi import APIRouter

from . import engine
from .assumptions import IncomeAssumptions
from .schemas import (
    IncomeRealityRequest,
    IncomeRealityResponse,
    PlatformEarningOut,
    TrendSummaryOut,
    WeekBreakdownOut,
)

router = APIRouter()


@router.post("/breakdown", response_model=IncomeRealityResponse)
def post_breakdown(request: IncomeRealityRequest) -> IncomeRealityResponse:
    assumptions = IncomeAssumptions(
        apply_cpf=request.assumptions.apply_cpf,
        cpf_rate_bps=request.assumptions.cpf_rate_bps,
    )
    weeks = [
        engine.WeeklyEntry(
            week_start=week.week_start,
            platform_earnings=tuple(
                engine.PlatformEarning(platform=p.platform, gross_cents=p.gross_cents)
                for p in week.platform_earnings
            ),
            work_costs_cents=week.work_costs_cents,
            essential_expenses_cents=week.essential_expenses_cents,
        )
        for week in request.weeks
    ]

    breakdowns, trend = engine.calculate_income_reality(weeks, assumptions)

    return IncomeRealityResponse(
        weeks=[
            WeekBreakdownOut(
                week_start=b.week_start,
                gross_earnings_cents=b.gross_earnings_cents,
                platform_breakdown=[
                    PlatformEarningOut(platform=p.platform, gross_cents=p.gross_cents)
                    for p in b.platform_breakdown
                ],
                work_costs_cents=b.work_costs_cents,
                cpf_cents=b.cpf_cents,
                net_income_cents=b.net_income_cents,
                essential_expenses_cents=b.essential_expenses_cents,
                surplus_cents=b.surplus_cents,
            )
            for b in breakdowns
        ],
        trend=TrendSummaryOut(
            weeks_considered=trend.weeks_considered,
            average_net_income_cents=trend.average_net_income_cents,
            min_net_income_cents=trend.min_net_income_cents,
            max_net_income_cents=trend.max_net_income_cents,
            stdev_net_income_cents=trend.stdev_net_income_cents,
            conservative_weekly_income_cents=trend.conservative_weekly_income_cents,
        ),
        assumptions_applied=request.assumptions,
    )
