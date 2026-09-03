from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from .memory import (
    InMemoryContributionRepository,
    InMemoryFinancialContextRepository,
    InMemoryPlanRepository,
)
from .models import WeeklySurplus
from .schemas import ContributionWrite
from .service import ResilienceJarService

DEMO_USER_ID = "demo-user"


def build_demo_service() -> ResilienceJarService:
    singapore_today = datetime.now(ZoneInfo("Asia/Singapore")).date()
    current_week_start = singapore_today - timedelta(days=singapore_today.weekday())
    recent_completed_week = current_week_start - timedelta(days=7)

    plans = InMemoryPlanRepository()
    contributions = InMemoryContributionRepository()
    context = InMemoryFinancialContextRepository(contributions)
    context.set_surpluses(
        DEMO_USER_ID,
        [
            WeeklySurplus(recent_completed_week, 48_000),
            WeeklySurplus(recent_completed_week - timedelta(days=7), 62_000),
            WeeklySurplus(recent_completed_week - timedelta(days=14), 35_000),
            WeeklySurplus(recent_completed_week - timedelta(days=21), 55_000),
        ],
    )
    context.set_weekly_essential_expenses_cents(DEMO_USER_ID, 70_000)
    service = ResilienceJarService(
        plans,
        contributions,
        context,
        today_provider=lambda: singapore_today,
    )
    service.create_contribution(
        DEMO_USER_ID,
        ContributionWrite(
            amount_cents=12_500,
            contribution_date=singapore_today,
            note="First step",
        ),
    )
    return service
