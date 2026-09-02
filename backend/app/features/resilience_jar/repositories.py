from __future__ import annotations

from datetime import date
from typing import Protocol

from .models import Contribution, JarPlan, WeeklySurplus


class PlanRepository(Protocol):
    def get(self, user_id: str) -> JarPlan | None: ...

    def save(self, plan: JarPlan) -> JarPlan: ...


class ContributionRepository(Protocol):
    def list_for_user(self, user_id: str) -> list[Contribution]: ...

    def create(
        self,
        user_id: str,
        entry_type: str,
        amount_cents: int,
        contribution_date: date,
        note: str | None,
    ) -> Contribution: ...

    def update(
        self,
        user_id: str,
        contribution_id: str,
        entry_type: str,
        amount_cents: int,
        contribution_date: date,
        note: str | None,
    ) -> Contribution | None: ...

    def delete(self, user_id: str, contribution_id: str) -> bool: ...


class FinancialContextRepository(Protocol):
    def list_completed_weekly_surpluses(self, user_id: str) -> list[WeeklySurplus]: ...

    def get_weekly_essential_expenses_cents(self, user_id: str) -> int | None: ...
