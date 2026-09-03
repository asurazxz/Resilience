"""SQLAlchemy adapters for the Emergency Fund domain service."""

from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID, uuid4

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, selectinload

from ...core.errors import DomainError
from ...db.models import (
    EmergencyFundContribution,
    EmergencyFundPlan,
    Profile,
    Transaction,
    WeeklyEntry,
)
from ..emergency_fund_ledger import (
    emergency_fund_balance,
    emergency_fund_net_activity_cents,
    weekly_essential_expenses_cents,
    weekly_recurring_work_costs_cents,
)
from .models import (
    DEFAULT_COVERAGE_WEEKS,
    AmountGoal,
    Contribution,
    CoverageGoal,
    JarPlan,
    PlanStatus,
    RecommendationMethod,
    TargetFrequency,
    WeeklySurplus,
)


class SqlPlanRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, user_id: str) -> JarPlan | None:
        record = self.session.get(EmergencyFundPlan, UUID(user_id))
        return _plan_from_record(record) if record else None

    def save(self, plan: JarPlan) -> JarPlan:
        user_id = UUID(plan.user_id)
        record = self.session.get(EmergencyFundPlan, user_id)
        values = _plan_values(plan)
        if record is None:
            record = EmergencyFundPlan(user_id=user_id, **values)
            self.session.add(record)
        else:
            for key, value in values.items():
                setattr(record, key, value)
        self.session.commit()
        self.session.refresh(record)
        return _plan_from_record(record)


class SqlContributionRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_for_user(self, user_id: str) -> list[Contribution]:
        records = self.session.scalars(
            select(EmergencyFundContribution)
            .where(EmergencyFundContribution.user_id == UUID(user_id))
            .order_by(
                EmergencyFundContribution.contribution_date.desc(),
                EmergencyFundContribution.created_at.desc(),
            )
        ).all()
        return [_contribution_from_record(record) for record in records]

    def get(self, user_id: str, contribution_id: str) -> Contribution | None:
        record = self.session.get(EmergencyFundContribution, UUID(contribution_id))
        if record is None or record.user_id != UUID(user_id):
            return None
        return _contribution_from_record(record)

    def create(
        self,
        user_id: str,
        entry_type: str,
        amount_cents: int,
        contribution_date: date,
        note: str | None,
    ) -> Contribution:
        record = EmergencyFundContribution(
            id=uuid4(),
            user_id=UUID(user_id),
            entry_type=entry_type,
            amount_cents=amount_cents,
            contribution_date=contribution_date,
            note=note,
        )
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return _contribution_from_record(record)

    def update(
        self,
        user_id: str,
        contribution_id: str,
        entry_type: str,
        amount_cents: int,
        contribution_date: date,
        note: str | None,
    ) -> Contribution | None:
        record = self.session.get(EmergencyFundContribution, UUID(contribution_id))
        if record is None or record.user_id != UUID(user_id):
            return None
        record.entry_type, record.amount_cents, record.contribution_date, record.note = (
            entry_type,
            amount_cents,
            contribution_date,
            note,
        )
        self.session.commit()
        self.session.refresh(record)
        return _contribution_from_record(record)

    def delete(self, user_id: str, contribution_id: str) -> bool:
        record = self.session.get(EmergencyFundContribution, UUID(contribution_id))
        if record is None or record.user_id != UUID(user_id):
            return False
        self.session.delete(record)
        self.session.commit()
        return True


class SqlFinancialContextRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_completed_weekly_surpluses(self, user_id: str) -> list[WeeklySurplus]:
        """``S_w = income_w - variable_costs_w - R - E`` per Monday-Sunday week.

        The three deductions come from the shared ledger module so the Income
        Reality screen and this feature report the same surplus for a week.
        """
        deductions = self._weekly_deductions_cents(user_id)
        week_start = func.date_trunc("week", Transaction.occurred_on)
        rows = self.session.execute(
            select(
                week_start.label("week_start"),
                func.sum(
                    case(
                        (Transaction.entry_type == "income", Transaction.amount_cents),
                        else_=-Transaction.amount_cents,
                    )
                ).label("net_cents"),
            )
            .where(Transaction.user_id == UUID(user_id))
            .group_by(week_start)
        ).all()
        if rows:
            return [
                WeeklySurplus(row.week_start.date(), int(row.net_cents) - deductions)
                for row in rows
            ]
        weeks = self.session.scalars(
            select(WeeklyEntry)
            .where(WeeklyEntry.user_id == UUID(user_id), WeeklyEntry.status == "confirmed")
            .options(
                selectinload(WeeklyEntry.earnings),
                selectinload(WeeklyEntry.variable_costs),
                selectinload(WeeklyEntry.input_snapshots),
            )
        ).all()
        return [WeeklySurplus(week.week_start, _week_surplus(week, deductions)) for week in weeks]

    def get_weekly_essential_expenses_cents(self, user_id: str) -> int | None:
        return weekly_essential_expenses_cents(self.session, UUID(user_id))

    def _weekly_deductions_cents(self, user_id: str) -> int:
        """``R + E``: recurring work costs plus essential expenses, per week."""
        uuid = UUID(user_id)
        return weekly_recurring_work_costs_cents(self.session, uuid) + (
            weekly_essential_expenses_cents(self.session, uuid) or 0
        )

    def get_emergency_fund_balance_cents(self, user_id: str) -> int:
        return emergency_fund_balance(self.session, UUID(user_id))

    def set_emergency_fund_balance_cents(self, user_id: str, amount_cents: int) -> None:
        profile = self.session.get(Profile, UUID(user_id))
        if profile is None:
            raise DomainError(
                404, "PROFILE_NOT_FOUND", "Profile is required for emergency-fund activity."
            )
        # Preserve the activity ledger while reconciling a user-entered current balance.
        profile.latest_emergency_savings_cents = amount_cents - emergency_fund_net_activity_cents(
            self.session, UUID(user_id)
        )
        self.session.commit()


def _week_surplus(week: WeeklyEntry, current_deductions_cents: int) -> int:
    """Same definition as the transaction path, using the week's own snapshots.

    ``input_snapshots`` record the recurring work costs and essential expenses
    as they stood that week, so they replace ``R + E`` when present.
    """
    earnings = sum(item.amount_cents for item in week.earnings)
    costs = sum(item.amount_cents for item in week.variable_costs)
    if week.input_snapshots:
        costs += sum(
            item.amount_cents if item.cadence == "weekly" else item.amount_cents * 12 // 52
            for item in week.input_snapshots
        )
    else:
        costs += current_deductions_cents
    return earnings - costs


def _plan_values(plan: JarPlan) -> dict[str, object]:
    goal = plan.goal
    return {
        "recommendation_method": plan.recommendation_method.value,
        "target_frequency": plan.target_frequency.value,
        "target_amount_cents": plan.target_amount_cents,
        "weekly_target_cents": plan.weekly_target_cents,
        "status": plan.status.value,
        "goal_mode": goal.mode,
        "goal_amount_cents": goal.amount_cents if isinstance(goal, AmountGoal) else None,
        "goal_weeks": goal.weeks if isinstance(goal, CoverageGoal) else None,
        "goal_expense_baseline_cents": plan.goal_expense_baseline_cents,
        "updated_at": plan.updated_at or datetime.now(UTC),
    }


def _plan_from_record(record: EmergencyFundPlan) -> JarPlan:
    goal = (
        AmountGoal(record.goal_amount_cents)
        if record.goal_mode == "amount"
        else CoverageGoal(record.goal_weeks or DEFAULT_COVERAGE_WEEKS)
    )
    return JarPlan(
        str(record.user_id),
        RecommendationMethod(record.recommendation_method),
        TargetFrequency(record.target_frequency),
        record.target_amount_cents,
        record.weekly_target_cents,
        PlanStatus(record.status),
        goal,
        record.goal_expense_baseline_cents,
        record.updated_at,
    )


def _contribution_from_record(record: EmergencyFundContribution) -> Contribution:
    return Contribution(
        str(record.id),
        str(record.user_id),
        record.entry_type,
        record.amount_cents,
        record.contribution_date,
        record.note,
        record.created_at,
        record.updated_at,
    )
