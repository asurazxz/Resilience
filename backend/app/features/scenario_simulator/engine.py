"""Deterministic shock-model calculations.

This module has no framework, database, network, or LLM dependency so the
figures the user sees can be unit-tested in isolation. Nothing here may be
replaced by a model-generated estimate.
"""

from .guidance import DISCLAIMERS, build_actions, resources_for_actions
from .models import (
    BaselineFinances,
    BaselineSummary,
    ScenarioResult,
    ScenarioSummary,
    ShockScenario,
    WeekProjection,
)

DEFAULT_TAIL_WEEKS = 4
MIN_HORIZON_WEEKS = 8
MAX_HORIZON_WEEKS = 52


def _scaled(amount_cents: int, numerator: int, denominator: int) -> int:
    """Scale a non-negative cent amount by a fraction, truncating to whole cents.

    Truncation is applied consistently so that re-running the same scenario
    always produces byte-identical figures.
    """
    return amount_cents * numerator // denominator


def _income_factor(week: int, scenario: ShockScenario) -> tuple[int, int]:
    """Return the earnings multiplier for a week as an exact fraction.

    Recovery ramps linearly from the reduced level back to baseline, reaching
    full baseline the week after the recovery period ends.
    """
    reduction = scenario.income_reduction_percent
    if week <= scenario.weeks_affected:
        return (100 - reduction, 100)

    # Recovery only follows an actual disruption. Without one there is nothing
    # to climb back from, and a recovery period must not reduce earnings.
    recovery_index = week - scenario.weeks_affected
    if reduction > 0 and scenario.weeks_affected > 0 and recovery_index <= scenario.recovery_weeks:
        span = scenario.recovery_weeks + 1
        return ((100 - reduction) * span + reduction * recovery_index, 100 * span)

    return (1, 1)


def _horizon_weeks(scenario: ShockScenario) -> int:
    if scenario.horizon_weeks is not None:
        return min(scenario.horizon_weeks, MAX_HORIZON_WEEKS)
    natural = scenario.weeks_affected + scenario.recovery_weeks + DEFAULT_TAIL_WEEKS
    return max(MIN_HORIZON_WEEKS, min(natural, MAX_HORIZON_WEEKS))


def _baseline_summary(baseline: BaselineFinances) -> BaselineSummary:
    surplus = baseline.weekly_surplus_cents
    essentials = baseline.weekly_essential_expenses_cents

    weeks_of_essentials = None
    if essentials > 0:
        weeks_of_essentials = baseline.emergency_savings_cents // essentials

    # A non-negative surplus is never drawn down, so the buffer has no baseline
    # end date and reporting a number would be misleading.
    runway_weeks = None
    if surplus < 0:
        runway_weeks = baseline.emergency_savings_cents // -surplus

    return BaselineSummary(
        weekly_gross_earnings_cents=baseline.weekly_gross_earnings_cents,
        weekly_work_costs_cents=baseline.weekly_work_costs_cents,
        weekly_net_work_income_cents=baseline.weekly_net_work_income_cents,
        weekly_essential_expenses_cents=essentials,
        weekly_surplus_cents=surplus,
        emergency_savings_cents=baseline.emergency_savings_cents,
        emergency_savings_weeks_of_essentials=weeks_of_essentials,
        runway_weeks=runway_weeks,
    )


def project_weeks(
    baseline: BaselineFinances, scenario: ShockScenario
) -> tuple[WeekProjection, ...]:
    """Project each week of the scenario from the first affected week onward."""
    horizon = _horizon_weeks(scenario)
    weeks: list[WeekProjection] = []
    buffer_open = baseline.emergency_savings_cents

    for week in range(1, horizon + 1):
        numerator, denominator = _income_factor(week, scenario)
        gross = _scaled(baseline.weekly_gross_earnings_cents, numerator, denominator)

        # Variable costs fall with the work actually done; fixed costs such as
        # vehicle rental or insurance continue even in a week with no earnings.
        variable_costs = _scaled(baseline.weekly_variable_work_costs_cents, numerator, denominator)
        work_costs = variable_costs + baseline.weekly_fixed_work_costs_cents
        net_work_income = gross - work_costs

        one_off = scenario.unexpected_cost_cents if week == 1 else 0
        net_cash_flow = net_work_income - baseline.weekly_essential_expenses_cents - one_off

        # The buffer cannot go below zero in reality; anything beyond it is an
        # unmet need reported separately rather than a negative balance.
        available = buffer_open + net_cash_flow
        if available >= 0:
            buffer_close = available
            shortfall = 0
        else:
            buffer_close = 0
            shortfall = -available

        weeks.append(
            WeekProjection(
                week=week,
                gross_earnings_cents=gross,
                work_costs_cents=work_costs,
                net_work_income_cents=net_work_income,
                essential_expenses_cents=baseline.weekly_essential_expenses_cents,
                one_off_cost_cents=one_off,
                net_cash_flow_cents=net_cash_flow,
                buffer_open_cents=buffer_open,
                buffer_close_cents=buffer_close,
                shortfall_cents=shortfall,
            )
        )
        buffer_open = buffer_close

    return tuple(weeks)


def _scenario_summary(
    baseline: BaselineFinances,
    scenario: ShockScenario,
    weeks: tuple[WeekProjection, ...],
) -> ScenarioSummary:
    shock_week = weeks[0] if scenario.weeks_affected > 0 else None

    first_shortfall_week = next((week.week for week in weeks if week.shortfall_cents > 0), None)
    # Weeks fully covered by the buffer are the weeks completed before money
    # first runs out, so a shortfall in week 1 means a runway of zero weeks.
    buffer_runway_weeks = None if first_shortfall_week is None else first_shortfall_week - 1

    lowest_week = min(weeks, key=lambda week: (week.buffer_close_cents, week.week))

    baseline_net = baseline.weekly_net_work_income_cents
    total_income_lost = sum(baseline_net - week.net_work_income_cents for week in weeks)

    full_income_resumes_week = None
    if scenario.income_reduction_percent > 0 and scenario.weeks_affected > 0:
        resume_week = scenario.weeks_affected + scenario.recovery_weeks + 1
        if resume_week <= weeks[-1].week:
            full_income_resumes_week = resume_week

    return ScenarioSummary(
        horizon_weeks=weeks[-1].week,
        weeks_affected=scenario.weeks_affected,
        recovery_weeks=scenario.recovery_weeks,
        weekly_net_work_income_during_shock_cents=(
            shock_week.net_work_income_cents if shock_week else baseline_net
        ),
        weekly_net_cash_flow_during_shock_cents=(
            # Week 1 carries the one-off cost, so the recurring weekly figure
            # reports the shock without it.
            shock_week.net_cash_flow_cents + shock_week.one_off_cost_cents
            if shock_week
            else baseline.weekly_surplus_cents
        ),
        unexpected_cost_cents=scenario.unexpected_cost_cents,
        total_income_lost_cents=total_income_lost,
        lowest_buffer_cents=lowest_week.buffer_close_cents,
        lowest_buffer_week=lowest_week.week,
        buffer_runway_weeks=buffer_runway_weeks,
        first_shortfall_week=first_shortfall_week,
        total_shortfall_cents=sum(week.shortfall_cents for week in weeks),
        buffer_at_horizon_cents=weeks[-1].buffer_close_cents,
        buffer_holds_through_horizon=first_shortfall_week is None,
        full_income_resumes_week=full_income_resumes_week,
    )


def simulate(baseline: BaselineFinances, scenario: ShockScenario) -> ScenarioResult:
    """Run one scenario and return every figure the results screen displays."""
    weeks = project_weeks(baseline, scenario)
    baseline_summary = _baseline_summary(baseline)
    scenario_summary = _scenario_summary(baseline, scenario, weeks)
    actions = build_actions(baseline, scenario, baseline_summary, scenario_summary)

    return ScenarioResult(
        baseline=baseline_summary,
        scenario=scenario_summary,
        weeks=weeks,
        actions=actions,
        resources=resources_for_actions(actions),
        disclaimers=DISCLAIMERS,
    )
