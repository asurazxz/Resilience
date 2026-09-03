from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import date, datetime
from enum import StrEnum


class RecommendationMethod(StrEnum):
    CONSERVATIVE_FOUR_WEEK = "conservative_4_week"
    LATEST_WEEK = "latest_week"


class PlanStatus(StrEnum):
    ACTIVE = "active"
    PAUSED = "paused"


class TargetFrequency(StrEnum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"


@dataclass(frozen=True)
class AmountGoal:
    amount_cents: int
    mode: str = "amount"


DEFAULT_COVERAGE_WEEKS = 26


@dataclass(frozen=True)
class CoverageGoal:
    weeks: int = DEFAULT_COVERAGE_WEEKS
    mode: str = "coverage"


type Goal = AmountGoal | CoverageGoal


@dataclass(frozen=True)
class WeeklySurplus:
    week_start: date
    available_surplus_cents: int


@dataclass(frozen=True)
class JarPlan:
    user_id: str
    recommendation_method: RecommendationMethod = RecommendationMethod.CONSERVATIVE_FOUR_WEEK
    target_frequency: TargetFrequency = TargetFrequency.WEEKLY
    target_amount_cents: int = 0
    weekly_target_cents: int = 0
    status: PlanStatus = PlanStatus.ACTIVE
    goal: Goal = CoverageGoal(weeks=DEFAULT_COVERAGE_WEEKS)
    goal_expense_baseline_cents: int | None = None
    updated_at: datetime | None = None

    def updated(self, **changes: object) -> JarPlan:
        return replace(self, **changes)


@dataclass(frozen=True)
class Contribution:
    id: str
    user_id: str
    entry_type: str
    amount_cents: int
    contribution_date: date
    note: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class Recommendation:
    status: str
    method: RecommendationMethod
    amount_cents: int | None
    latest_surplus_cents: int | None
    history_weeks_used: int
    as_of_week_start: date | None
    rationale_code: str


@dataclass(frozen=True)
class Progress:
    contribution_total_cents: int
    goal_target_cents: int | None
    progress_percent: float | None
    coverage_days: float | None
    coverage_weeks: float | None
    goal_reached: bool = False
    remaining_cents: int | None = None


@dataclass(frozen=True)
class GoalReview:
    status: str
    previous_weekly_expenses_cents: int | None
    current_weekly_expenses_cents: int | None
    expense_change_cents: int | None


@dataclass(frozen=True)
class CompletionProjection:
    status: str
    projected_date: date | None
    weeks_remaining: int | None
    remaining_cents: int | None


@dataclass(frozen=True)
class Milestone:
    percentage: int
    target_cents: int
    reached: bool


@dataclass(frozen=True)
class JarSummary:
    plan: JarPlan
    recommendation: Recommendation
    progress: Progress
    goal_review: GoalReview
    completion_projection: CompletionProjection
    milestones: tuple[Milestone, ...]
    weekly_essential_expenses_cents: int | None
    contributions: tuple[Contribution, ...]
