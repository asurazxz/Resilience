from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Callable
from zoneinfo import ZoneInfo

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
    GoalReview,
    JarPlan,
    JarSummary,
    PlanStatus,
    RecommendationMethod,
    TargetFrequency,
)
from .repositories import (
    ContributionRepository,
    FinancialContextRepository,
    PlanRepository,
)


class DomainError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        *,
        status_code: int = 400,
        field_errors: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.field_errors = field_errors or {}

    def as_dict(self) -> dict[str, object]:
        return {
            "code": self.code,
            "message": self.message,
            "field_errors": self.field_errors,
        }


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
        essential_expenses = (
            self._financial_context.get_weekly_essential_expenses_cents(user_id)
        )
        progress = calculate_progress(
            plan.goal,
            [
                contribution.amount_cents
                if contribution.entry_type == "deposit"
                else -contribution.amount_cents
                for contribution in contributions
            ],
            essential_expenses,
        )
        return JarSummary(
            plan=plan,
            recommendation=recommend_weekly_savings(
                plan.recommendation_method, surpluses
            ),
            progress=progress,
            goal_review=self._goal_review(plan, essential_expenses),
            completion_projection=calculate_completion_projection(
                plan, progress, self._today()
            ),
            milestones=calculate_milestones(
                progress.goal_target_cents, progress.contribution_total_cents
            ),
            weekly_essential_expenses_cents=essential_expenses,
            contributions=tuple(contributions),
        )

    def patch_plan(self, user_id: str, payload: dict[str, Any]) -> JarSummary:
        self._require_object(payload)
        allowed_fields = {
            "recommendation_method",
            "target_frequency",
            "target_amount_cents",
            "weekly_target_cents",
            "status",
            "goal",
        }
        self._reject_unknown_fields(payload, allowed_fields)
        if not payload:
            raise DomainError(
                "validation_error",
                "At least one plan field is required.",
                field_errors={"body": "Provide a field to update."},
            )

        plan = self._get_or_create_plan(user_id)
        changes: dict[str, object] = {}

        if "recommendation_method" in payload:
            changes["recommendation_method"] = self._parse_enum(
                RecommendationMethod,
                payload["recommendation_method"],
                "recommendation_method",
            )
        if "target_frequency" in payload:
            changes["target_frequency"] = self._parse_enum(
                TargetFrequency, payload["target_frequency"], "target_frequency"
            )
        target_frequency = changes.get("target_frequency", plan.target_frequency)
        if "target_amount_cents" in payload:
            target_amount_cents = self._non_negative_integer(
                payload["target_amount_cents"], "target_amount_cents"
            )
            changes["target_amount_cents"] = target_amount_cents
            changes["weekly_target_cents"] = target_amount_to_weekly_cents(
                target_amount_cents, target_frequency
            )
        elif "weekly_target_cents" in payload:
            weekly_target_cents = self._non_negative_integer(
                payload["weekly_target_cents"], "weekly_target_cents"
            )
            changes["weekly_target_cents"] = weekly_target_cents
            changes["target_amount_cents"] = weekly_cents_to_target_amount(
                weekly_target_cents, target_frequency
            )
        elif "target_frequency" in payload:
            changes["target_amount_cents"] = weekly_cents_to_target_amount(
                plan.weekly_target_cents, target_frequency
            )
        if "status" in payload:
            changes["status"] = self._parse_enum(
                PlanStatus, payload["status"], "status"
            )
        if "goal" in payload:
            changes["goal"] = self._parse_goal(payload["goal"])
            current_expenses = (
                self._financial_context.get_weekly_essential_expenses_cents(user_id)
            )
            changes["goal_expense_baseline_cents"] = (
                current_expenses
                if current_expenses is not None and current_expenses > 0
                else None
            )

        changes["updated_at"] = datetime.now(timezone.utc)
        self._plans.save(plan.updated(**changes))
        return self.get_summary(user_id)

    def create_contribution(
        self, user_id: str, payload: dict[str, Any]
    ) -> Contribution:
        self._require_object(payload)
        allowed_fields = {"amount_cents", "contribution_date", "note"}
        self._reject_unknown_fields(payload, allowed_fields)
        missing = [
            field for field in ("amount_cents", "contribution_date")
            if field not in payload
        ]
        if missing:
            raise DomainError(
                "validation_error",
                "Required contribution fields are missing.",
                field_errors={field: "This field is required." for field in missing},
            )
        amount_cents = self._positive_integer(payload["amount_cents"], "amount_cents")
        contribution_date = self._contribution_date(payload["contribution_date"])
        note = self._note(payload.get("note"))
        return self._contributions.create(
            user_id, "deposit", amount_cents, contribution_date, note
        )

    def create_withdrawal(
        self, user_id: str, payload: dict[str, Any]
    ) -> Contribution:
        self._require_object(payload)
        allowed_fields = {"amount_cents", "contribution_date", "note"}
        self._reject_unknown_fields(payload, allowed_fields)
        missing = [
            field for field in ("amount_cents", "contribution_date")
            if field not in payload
        ]
        if missing:
            raise DomainError(
                "validation_error",
                "Required withdrawal fields are missing.",
                field_errors={field: "This field is required." for field in missing},
            )
        amount_cents = self._positive_integer(payload["amount_cents"], "amount_cents")
        if amount_cents > self._ledger_balance(user_id):
            raise DomainError(
                "insufficient_jar_balance",
                "Withdrawal cannot exceed the tracked emergency fund balance.",
                field_errors={"amount_cents": "Use an amount within the tracked balance."},
            )
        return self._contributions.create(
            user_id,
            "withdrawal",
            amount_cents,
            self._contribution_date(payload["contribution_date"]),
            self._note(payload.get("note")),
        )

    def update_contribution(
        self,
        user_id: str,
        contribution_id: str,
        payload: dict[str, Any],
    ) -> Contribution:
        self._require_object(payload)
        allowed_fields = {"amount_cents", "contribution_date", "note"}
        self._reject_unknown_fields(payload, allowed_fields)
        if not payload:
            raise DomainError(
                "validation_error",
                "At least one contribution field is required.",
                field_errors={"body": "Provide a field to update."},
            )
        existing = next(
            (
                contribution
                for contribution in self._contributions.list_for_user(user_id)
                if contribution.id == contribution_id
            ),
            None,
        )
        if existing is None:
            self._not_found()

        amount_cents = (
            self._positive_integer(payload["amount_cents"], "amount_cents")
            if "amount_cents" in payload
            else existing.amount_cents
        )
        contribution_date = (
            self._contribution_date(payload["contribution_date"])
            if "contribution_date" in payload
            else existing.contribution_date
        )
        note = self._note(payload["note"]) if "note" in payload else existing.note
        remaining_balance = self._ledger_balance(
            user_id, excluding_contribution_id=existing.id
        ) + (amount_cents if existing.entry_type == "deposit" else -amount_cents)
        if remaining_balance < 0:
            raise DomainError(
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
        existing = next(
            (
                contribution
                for contribution in self._contributions.list_for_user(user_id)
                if contribution.id == contribution_id
            ),
            None,
        )
        if existing is None:
            self._not_found()
        if (
            existing.entry_type == "deposit"
            and self._ledger_balance(user_id) - existing.amount_cents < 0
        ):
            raise DomainError(
                "insufficient_jar_balance",
                "This deposit cannot be deleted while later withdrawals depend on it.",
                status_code=409,
            )
        if not self._contributions.delete(user_id, contribution_id):
            self._not_found()

    def _ledger_balance(
        self, user_id: str, *, excluding_contribution_id: str | None = None
    ) -> int:
        return sum(
            contribution.amount_cents
            if contribution.entry_type == "deposit"
            else -contribution.amount_cents
            for contribution in self._contributions.list_for_user(user_id)
            if contribution.id != excluding_contribution_id
        )

    def _get_or_create_plan(self, user_id: str) -> JarPlan:
        plan = self._plans.get(user_id)
        if plan is None:
            current_expenses = (
                self._financial_context.get_weekly_essential_expenses_cents(user_id)
            )
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
    def _goal_review(
        plan: JarPlan, current_expenses: int | None
    ) -> GoalReview:
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

    @staticmethod
    def _parse_enum(enum_type: type, value: object, field: str) -> object:
        try:
            return enum_type(value)
        except (TypeError, ValueError):
            choices = ", ".join(item.value for item in enum_type)
            raise DomainError(
                "validation_error",
                "One or more fields are invalid.",
                field_errors={field: f"Choose one of: {choices}."},
            ) from None

    def _parse_goal(self, value: object) -> AmountGoal | CoverageGoal:
        if not isinstance(value, dict):
            raise DomainError(
                "validation_error",
                "One or more fields are invalid.",
                field_errors={"goal": "Goal must be an object."},
            )
        mode = value.get("mode")
        if mode == "amount":
            self._reject_unknown_fields(value, {"mode", "amount_cents"}, prefix="goal.")
            if "amount_cents" not in value:
                self._required("goal.amount_cents")
            amount = self._positive_integer(value["amount_cents"], "goal.amount_cents")
            return AmountGoal(amount_cents=amount)
        if mode == "coverage":
            self._reject_unknown_fields(value, {"mode", "weeks"}, prefix="goal.")
            if "weeks" not in value:
                self._required("goal.weeks")
            weeks = self._positive_integer(value["weeks"], "goal.weeks")
            if weeks > 52:
                raise DomainError(
                    "validation_error",
                    "One or more fields are invalid.",
                    field_errors={"goal.weeks": "Use a whole number from 1 to 52."},
                )
            return CoverageGoal(weeks=weeks)
        raise DomainError(
            "validation_error",
            "One or more fields are invalid.",
            field_errors={"goal.mode": "Choose amount or coverage."},
        )

    def _contribution_date(self, value: object) -> date:
        if not isinstance(value, str):
            self._invalid_date()
        try:
            parsed = date.fromisoformat(value)
        except ValueError:
            self._invalid_date()
        if parsed > self._today():
            raise DomainError(
                "validation_error",
                "One or more fields are invalid.",
                field_errors={
                    "contribution_date": "Contribution date cannot be in the future."
                },
            )
        return parsed

    @staticmethod
    def _note(value: object) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str):
            raise DomainError(
                "validation_error",
                "One or more fields are invalid.",
                field_errors={"note": "Note must be text."},
            )
        note = value.strip()
        if len(note) > 200:
            raise DomainError(
                "validation_error",
                "One or more fields are invalid.",
                field_errors={"note": "Note must be 200 characters or fewer."},
            )
        return note or None

    @staticmethod
    def _positive_integer(value: object, field: str) -> int:
        if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
            raise DomainError(
                "validation_error",
                "One or more fields are invalid.",
                field_errors={field: "Use a positive whole number of cents."},
            )
        return value

    @staticmethod
    def _non_negative_integer(value: object, field: str) -> int:
        if isinstance(value, bool) or not isinstance(value, int) or value < 0:
            raise DomainError(
                "validation_error",
                "One or more fields are invalid.",
                field_errors={field: "Use zero or a positive whole number of cents."},
            )
        return value

    @staticmethod
    def _reject_unknown_fields(
        payload: dict[str, Any], allowed: set[str], *, prefix: str = ""
    ) -> None:
        unknown = sorted(set(payload) - allowed)
        if unknown:
            raise DomainError(
                "validation_error",
                "One or more fields are not supported.",
                field_errors={
                    f"{prefix}{field}": "Unknown field." for field in unknown
                },
            )

    @staticmethod
    def _require_object(payload: object) -> None:
        if not isinstance(payload, dict):
            raise DomainError(
                "validation_error",
                "Request body must be an object.",
                field_errors={"body": "Use a JSON object."},
            )

    @staticmethod
    def _required(field: str) -> None:
        raise DomainError(
            "validation_error",
            "A required field is missing.",
            field_errors={field: "This field is required."},
        )

    @staticmethod
    def _invalid_date() -> None:
        raise DomainError(
            "validation_error",
            "One or more fields are invalid.",
            field_errors={"contribution_date": "Use an ISO date in YYYY-MM-DD format."},
        )

    @staticmethod
    def _not_found() -> None:
        raise DomainError(
            "contribution_not_found",
            "Contribution was not found.",
            status_code=404,
        )


def singapore_today() -> date:
    return datetime.now(ZoneInfo("Asia/Singapore")).date()
