from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

from ...core.errors import DomainError
from .calculations import (
    calculate_completion_projection,
    calculate_milestones,
    calculate_progress,
    recommend_weekly_savings,
    target_amount_to_weekly_cents,
    weekly_cents_to_target_amount,
)
from .models import (
    AmountGoal,
    Contribution,
    CoverageGoal,
    Goal,
    GoalReview,
    JarPlan,
    JarSummary,
)
from .repositories import (
    ContributionRepository,
    FinancialContextRepository,
    PlanRepository,
)
from .schemas import (
    AmountGoalInput,
    ContributionPatch,
    ContributionWrite,
    CoverageGoalInput,
    OpeningBalanceRequest,
    PlanPatch,
)


class ResilienceJarService:
    def __init__(
        self,
        plans: PlanRepository,
        contributions: ContributionRepository,
        financial_context: FinancialContextRepository,
        *,
        today_provider: Callable[[], date] | None = None,
    ) -> None:
        self._plans = plans
        self._contributions = contributions
        self._financial_context = financial_context
        self._today = today_provider or singapore_today

    def get_summary(self, user_id: str) -> JarSummary:
        plan = self._get_or_create_plan(user_id)
        contributions = self._contributions.list_for_user(user_id)
        surpluses = self._financial_context.list_completed_weekly_surpluses(user_id)
        essential_expenses = self._financial_context.get_weekly_essential_expenses_cents(user_id)
        balance = self._financial_context.get_emergency_fund_balance_cents(user_id)
        progress = calculate_progress(plan.goal, [balance], essential_expenses)
        return JarSummary(
            plan=plan,
            recommendation=recommend_weekly_savings(plan.recommendation_method, surpluses),
            progress=progress,
            goal_review=self._goal_review(plan, essential_expenses),
            completion_projection=calculate_completion_projection(plan, progress, self._today()),
            milestones=calculate_milestones(
                progress.goal_target_cents, progress.contribution_total_cents
            ),
            weekly_essential_expenses_cents=essential_expenses,
            contributions=tuple(contributions),
        )

    def patch_plan(self, user_id: str, payload: PlanPatch) -> JarSummary:
        plan = self._get_or_create_plan(user_id)
        changes: dict[str, object] = {}

        if payload.recommendation_method is not None:
            changes["recommendation_method"] = payload.recommendation_method
        if payload.target_frequency is not None:
            changes["target_frequency"] = payload.target_frequency
        target_frequency = changes.get("target_frequency", plan.target_frequency)

        if payload.target_amount_cents is not None:
            changes["target_amount_cents"] = payload.target_amount_cents
            changes["weekly_target_cents"] = target_amount_to_weekly_cents(
                payload.target_amount_cents, target_frequency
            )
        elif payload.weekly_target_cents is not None:
            changes["weekly_target_cents"] = payload.weekly_target_cents
            changes["target_amount_cents"] = weekly_cents_to_target_amount(
                payload.weekly_target_cents, target_frequency
            )
        elif payload.target_frequency is not None:
            changes["target_amount_cents"] = weekly_cents_to_target_amount(
                plan.weekly_target_cents, target_frequency
            )

        if payload.status is not None:
            changes["status"] = payload.status
        if payload.goal is not None:
            changes["goal"] = _goal_from_input(payload.goal)
            current_expenses = self._financial_context.get_weekly_essential_expenses_cents(user_id)
            changes["goal_expense_baseline_cents"] = (
                current_expenses if current_expenses is not None and current_expenses > 0 else None
            )

        changes["updated_at"] = datetime.now(UTC)
        self._plans.save(plan.updated(**changes))
        return self.get_summary(user_id)

    def set_opening_balance(self, user_id: str, payload: OpeningBalanceRequest) -> JarSummary:
        self._financial_context.set_emergency_fund_balance_cents(user_id, payload.amount_cents)
        return self.get_summary(user_id)

    def create_contribution(self, user_id: str, payload: ContributionWrite) -> Contribution:
        return self._contributions.create(
            user_id,
            "deposit",
            payload.amount_cents,
            self._checked_date(payload.contribution_date),
            payload.note,
        )

    def create_withdrawal(self, user_id: str, payload: ContributionWrite) -> Contribution:
        if payload.amount_cents > self._ledger_balance(user_id):
            raise DomainError(
                400,
                "insufficient_jar_balance",
                "Withdrawal cannot exceed the tracked emergency fund balance.",
                field_errors={"amount_cents": "Use an amount within the tracked balance."},
            )
        return self._contributions.create(
            user_id,
            "withdrawal",
            payload.amount_cents,
            self._checked_date(payload.contribution_date),
            payload.note,
        )

    def update_contribution(
        self,
        user_id: str,
        contribution_id: str,
        payload: ContributionPatch,
    ) -> Contribution:
        existing = self._contributions.get(user_id, contribution_id)
        if existing is None:
            self._not_found()

        amount_cents = (
            payload.amount_cents if payload.amount_cents is not None else existing.amount_cents
        )
        contribution_date = (
            self._checked_date(payload.contribution_date)
            if payload.contribution_date is not None
            else existing.contribution_date
        )
        note = payload.note if "note" in payload.model_fields_set else existing.note
        remaining_balance = self._ledger_balance(user_id, excluding_contribution_id=existing.id) + (
            amount_cents if existing.entry_type == "deposit" else -amount_cents
        )
        if remaining_balance < 0:
            raise DomainError(
                400,
                "insufficient_jar_balance",
                "This change would make the tracked emergency fund balance negative.",
                field_errors={"amount_cents": "Reduce withdrawals before changing this entry."},
            )
        updated = self._contributions.update(
            user_id,
            contribution_id,
            existing.entry_type,
            amount_cents,
            contribution_date,
            note,
        )
        if updated is None:
            self._not_found()
        return updated

    def delete_contribution(self, user_id: str, contribution_id: str) -> None:
        existing = self._contributions.get(user_id, contribution_id)
        if existing is None:
            self._not_found()
        if (
            existing.entry_type == "deposit"
            and self._ledger_balance(user_id) - existing.amount_cents < 0
        ):
            raise DomainError(
                409,
                "insufficient_jar_balance",
                "This deposit cannot be deleted while later withdrawals depend on it.",
            )
        if not self._contributions.delete(user_id, contribution_id):
            self._not_found()

    def _ledger_balance(self, user_id: str, *, excluding_contribution_id: str | None = None) -> int:
        """``B``, optionally with one entry's effect backed out of it."""
        balance = self._financial_context.get_emergency_fund_balance_cents(user_id)
        if excluding_contribution_id is None:
            return balance
        existing = self._contributions.get(user_id, excluding_contribution_id)
        if existing is None:
            return balance
        return balance - (
            existing.amount_cents if existing.entry_type == "deposit" else -existing.amount_cents
        )

    def _get_or_create_plan(self, user_id: str) -> JarPlan:
        plan = self._plans.get(user_id)
        if plan is None:
            current_expenses = self._financial_context.get_weekly_essential_expenses_cents(user_id)
            plan = self._plans.save(
                JarPlan(
                    user_id=user_id,
                    goal_expense_baseline_cents=(
                        current_expenses
                        if current_expenses is not None and current_expenses > 0
                        else None
                    ),
                )
            )
        return plan

    @staticmethod
    def _goal_review(plan: JarPlan, current_expenses: int | None) -> GoalReview:
        baseline = plan.goal_expense_baseline_cents
        if current_expenses is None or current_expenses <= 0 or baseline is None:
            return GoalReview(
                status="unavailable",
                previous_weekly_expenses_cents=baseline,
                current_weekly_expenses_cents=current_expenses,
                expense_change_cents=None,
            )
        change = current_expenses - baseline
        return GoalReview(
            status="expenses_changed" if change != 0 else "up_to_date",
            previous_weekly_expenses_cents=baseline,
            current_weekly_expenses_cents=current_expenses,
            expense_change_cents=change,
        )

    def _checked_date(self, value: date) -> date:
        if value > self._today():
            raise DomainError(
                422,
                "validation_error",
                "One or more fields are invalid.",
                field_errors={"contribution_date": "Contribution date cannot be in the future."},
            )
        return value

    @staticmethod
    def _not_found() -> None:
        raise DomainError(404, "contribution_not_found", "Contribution was not found.")


def _goal_from_input(goal: AmountGoalInput | CoverageGoalInput) -> Goal:
    if isinstance(goal, AmountGoalInput):
        return AmountGoal(amount_cents=goal.amount_cents)
    return CoverageGoal(weeks=goal.weeks)


def singapore_today() -> date:
    return datetime.now(ZoneInfo("Asia/Singapore")).date()
