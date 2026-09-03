"""HTTP route for the Financial Score.

This module only assembles plain values from the existing repositories and
services and hands them to the pure calculator. No scoring logic lives here.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.auth import current_user_id
from ...db.session import get_session
from ..foundation_input.service import ensure_profile
from ..resilience_jar.models import AmountGoal
from ..resilience_jar.service import ResilienceJarService, singapore_today
from ..resilience_jar.sql_repositories import (
    SqlContributionRepository,
    SqlFinancialContextRepository,
    SqlPlanRepository,
)
from ..savings_goals.service import list_goals
from .calculator import (
    DepositInput,
    GoalContributionInput,
    JarInput,
    SavingsGoalInput,
    WeeklySurplusInput,
    calculate_financial_score,
)
from .schemas import FinancialScoreComponent, FinancialScoreMissingInput, FinancialScoreResponse

router = APIRouter(prefix="/financial-score", tags=["financial-score"])

SessionDep = Annotated[Session, Depends(get_session)]
UserDep = Annotated[UUID, Depends(current_user_id)]


@router.get("", response_model=FinancialScoreResponse)
def get_financial_score(session: SessionDep, user_id: UserDep) -> FinancialScoreResponse:
    ensure_profile(session, user_id)
    user_id_str = str(user_id)

    jar_service = ResilienceJarService(
        SqlPlanRepository(session),
        SqlContributionRepository(session),
        SqlFinancialContextRepository(session),
    )
    summary = jar_service.get_summary(user_id_str)

    goal = summary.plan.goal
    is_amount_goal = isinstance(goal, AmountGoal)
    jar_input = JarInput(
        goal_mode=goal.mode,
        goal_weeks=goal.weeks if not is_amount_goal else None,
        goal_amount_cents=goal.amount_cents if is_amount_goal else None,
        weekly_essential_expenses_cents=summary.weekly_essential_expenses_cents,
        balance_cents=summary.progress.contribution_total_cents,
        plan_status=summary.plan.status.value,
        weekly_target_cents=summary.plan.weekly_target_cents,
        recommendation_status=summary.recommendation.status,
        recommendation_amount_cents=summary.recommendation.amount_cents,
    )

    deposits = [
        DepositInput(item.contribution_date, item.amount_cents)
        for item in summary.contributions
        if item.entry_type == "deposit"
    ]

    goals = list_goals(session, user_id)
    savings_goal_inputs = [
        SavingsGoalInput(goal.status, goal.suggested_weekly_cents) for goal in goals
    ]
    goal_contributions = [
        GoalContributionInput(contribution.contributed_on, contribution.amount_cents)
        for goal in goals
        for contribution in goal.contributions
    ]

    surpluses = SqlFinancialContextRepository(session).list_completed_weekly_surpluses(user_id_str)
    weekly_surplus_inputs = [
        WeeklySurplusInput(item.week_start, item.income_cents, item.available_surplus_cents)
        for item in surpluses
    ]

    result = calculate_financial_score(
        singapore_today(),
        jar_input,
        savings_goal_inputs,
        weekly_surplus_inputs,
        deposits,
        goal_contributions,
    )

    return FinancialScoreResponse(
        score=result.score,
        band=result.band,
        generated_at=datetime.now(UTC),
        scored_max_points=result.scored_max_points,
        components=[
            FinancialScoreComponent(
                id=component.id,
                label=component.label,
                status=component.status,
                points=component.points,
                max_points=component.max_points,
                detail=component.detail,
            )
            for component in result.components
        ],
        next_step=result.next_step,
        missing_inputs=[
            FinancialScoreMissingInput(
                id=item.id,
                label=item.label,
                action=item.action,
                route=item.route,
            )
            for item in result.missing_inputs
        ],
    )
