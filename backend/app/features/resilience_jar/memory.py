from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import uuid4

from .models import Contribution, JarPlan, WeeklySurplus


class InMemoryPlanRepository:
    def __init__(self) -> None:
        self._plans: dict[str, JarPlan] = {}

    def get(self, user_id: str) -> JarPlan | None:
        return self._plans.get(user_id)

    def save(self, plan: JarPlan) -> JarPlan:
        self._plans[plan.user_id] = plan
        return plan


class InMemoryContributionRepository:
    def __init__(self) -> None:
        self._contributions: dict[str, Contribution] = {}

    def list_for_user(self, user_id: str) -> list[Contribution]:
        return sorted(
            (
                contribution
                for contribution in self._contributions.values()
                if contribution.user_id == user_id
            ),
            key=lambda contribution: (
                contribution.contribution_date,
                contribution.created_at,
            ),
            reverse=True,
        )

    def create(
        self,
        user_id: str,
        entry_type: str,
        amount_cents: int,
        contribution_date: date,
        note: str | None,
    ) -> Contribution:
        now = datetime.now(timezone.utc)
        contribution = Contribution(
            id=str(uuid4()),
            user_id=user_id,
            entry_type=entry_type,
            amount_cents=amount_cents,
            contribution_date=contribution_date,
            note=note,
            created_at=now,
            updated_at=now,
        )
        self._contributions[contribution.id] = contribution
        return contribution

    def update(
        self,
        user_id: str,
        contribution_id: str,
        entry_type: str,
        amount_cents: int,
        contribution_date: date,
        note: str | None,
    ) -> Contribution | None:
        existing = self._contributions.get(contribution_id)
        if existing is None or existing.user_id != user_id:
            return None
        updated = Contribution(
            id=existing.id,
            user_id=existing.user_id,
            entry_type=entry_type,
            amount_cents=amount_cents,
            contribution_date=contribution_date,
            note=note,
            created_at=existing.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        self._contributions[updated.id] = updated
        return updated

    def delete(self, user_id: str, contribution_id: str) -> bool:
        existing = self._contributions.get(contribution_id)
        if existing is None or existing.user_id != user_id:
            return False
        del self._contributions[contribution_id]
        return True


class InMemoryFinancialContextRepository:
    def __init__(self) -> None:
        self._surpluses: dict[str, list[WeeklySurplus]] = {}
        self._essential_expenses: dict[str, int | None] = {}

    def list_completed_weekly_surpluses(self, user_id: str) -> list[WeeklySurplus]:
        return list(self._surpluses.get(user_id, []))

    def get_weekly_essential_expenses_cents(self, user_id: str) -> int | None:
        return self._essential_expenses.get(user_id)

    def set_surpluses(self, user_id: str, surpluses: list[WeeklySurplus]) -> None:
        self._surpluses[user_id] = list(surpluses)

    def set_weekly_essential_expenses_cents(
        self, user_id: str, amount_cents: int | None
    ) -> None:
        self._essential_expenses[user_id] = amount_cents
