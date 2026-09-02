from __future__ import annotations

from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from fractions import Fraction

from .models import (
    AmountGoal,
    CompletionProjection,
    Goal,
    JarPlan,
    Milestone,
    PlanStatus,
    Progress,
    Recommendation,
    RecommendationMethod,
    TargetFrequency,
    WeeklySurplus,
)


def target_amount_to_weekly_cents(amount_cents: int, frequency: TargetFrequency) -> int:
    if frequency is TargetFrequency.WEEKLY:
        return amount_cents
    return amount_cents * 12 // 52


def weekly_cents_to_target_amount(weekly_cents: int, frequency: TargetFrequency) -> int:
    if frequency is TargetFrequency.WEEKLY:
        return weekly_cents
    return weekly_cents * 52 // 12


def _median(values: list[int]) -> Fraction:
    ordered = sorted(values)
    midpoint = len(ordered) // 2
    if len(ordered) % 2:
        return Fraction(ordered[midpoint])
    return Fraction(ordered[midpoint - 1] + ordered[midpoint], 2)


def recommend_weekly_savings(
    method: RecommendationMethod,
    weekly_surpluses: list[WeeklySurplus],
) -> Recommendation:
    ordered = sorted(weekly_surpluses, key=lambda week: week.week_start, reverse=True)
    if not ordered:
        return Recommendation(
            status="insufficient_data",
            method=method,
            amount_cents=None,
            latest_surplus_cents=None,
            history_weeks_used=0,
            as_of_week_start=None,
            rationale_code="no_completed_weeks",
        )

    latest = ordered[0]
    latest_non_negative = max(latest.available_surplus_cents, 0)

    if method is RecommendationMethod.LATEST_WEEK:
        amount_cents = latest_non_negative // 5
        weeks_used = 1
        rationale_code = (
            "latest_week_non_positive"
            if latest.available_surplus_cents <= 0
            else "latest_week_20_percent"
        )
    else:
        recent = ordered[:4]
        positive_surpluses = [
            week.available_surplus_cents for week in recent if week.available_surplus_cents > 0
        ]
        if latest_non_negative == 0 or not positive_surpluses:
            amount_cents = 0
            rationale_code = "latest_week_non_positive"
        else:
            safe_baseline = min(Fraction(latest_non_negative), _median(positive_surpluses))
            amount_cents = int(safe_baseline / 5)
            rationale_code = "four_week_median_capped_by_latest"
        weeks_used = len(recent)

    return Recommendation(
        status="ready",
        method=method,
        amount_cents=amount_cents,
        latest_surplus_cents=latest.available_surplus_cents,
        history_weeks_used=weeks_used,
        as_of_week_start=latest.week_start,
        rationale_code=rationale_code,
    )


def calculate_progress(
    goal: Goal,
    contribution_amounts_cents: list[int],
    weekly_essential_expenses_cents: int | None,
) -> Progress:
    contribution_total = sum(contribution_amounts_cents)

    if isinstance(goal, AmountGoal):
        goal_target_cents: int | None = goal.amount_cents
    elif weekly_essential_expenses_cents is not None and weekly_essential_expenses_cents > 0:
        goal_target_cents = weekly_essential_expenses_cents * goal.weeks
    else:
        goal_target_cents = None

    progress_percent = (
        _one_decimal(Decimal(contribution_total) * Decimal(100) / Decimal(goal_target_cents))
        if goal_target_cents
        else None
    )

    if weekly_essential_expenses_cents is None or weekly_essential_expenses_cents <= 0:
        coverage_days = None
        coverage_weeks = None
    else:
        coverage_weeks = _one_decimal(
            Decimal(contribution_total) / Decimal(weekly_essential_expenses_cents)
        )
        coverage_days = _one_decimal(
            Decimal(contribution_total) * Decimal(7) / Decimal(weekly_essential_expenses_cents)
        )

    return Progress(
        contribution_total_cents=contribution_total,
        goal_target_cents=goal_target_cents,
        progress_percent=progress_percent,
        coverage_days=coverage_days,
        coverage_weeks=coverage_weeks,
    )


def calculate_completion_projection(
    plan: JarPlan,
    progress: Progress,
    today: date,
) -> CompletionProjection:
    goal_target = progress.goal_target_cents
    if goal_target is None:
        return CompletionProjection("unavailable", None, None, None)
    remaining = max(goal_target - progress.contribution_total_cents, 0)
    if remaining == 0:
        return CompletionProjection("complete", today, 0, 0)
    if plan.status is PlanStatus.PAUSED:
        return CompletionProjection("paused", None, None, remaining)
    if plan.weekly_target_cents <= 0:
        return CompletionProjection("no_weekly_target", None, None, remaining)
    weeks_remaining = (remaining + plan.weekly_target_cents - 1) // plan.weekly_target_cents
    return CompletionProjection(
        "projected",
        today + timedelta(weeks=weeks_remaining),
        weeks_remaining,
        remaining,
    )


def calculate_milestones(
    goal_target_cents: int | None,
    contribution_total_cents: int,
) -> tuple[Milestone, ...]:
    if goal_target_cents is None or goal_target_cents <= 0:
        return ()
    return tuple(
        Milestone(
            percentage=percentage,
            target_cents=(goal_target_cents * percentage + 99) // 100,
            reached=(contribution_total_cents >= (goal_target_cents * percentage + 99) // 100),
        )
        for percentage in (25, 50, 75, 100)
    )


def _one_decimal(value: Decimal) -> float:
    return float(value.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))
