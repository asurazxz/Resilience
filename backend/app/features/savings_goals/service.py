"""Savings Goals: named habit goals kept strictly apart from the emergency fund.

Nothing here reads or writes ``profiles.latest_emergency_savings_cents`` or
``emergency_fund_contributions``. See section 7 of
``documentation/features/emergency-fund-model.md``.
"""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.errors import DomainError
from backend.app.db.models import SavingsGoal, SavingsGoalContribution
from backend.app.features.foundation_input.service import ensure_profile
from backend.app.features.savings_goals.schemas import (
    SavingsGoalContributionCreate,
    SavingsGoalContributionResponse,
    SavingsGoalCreate,
    SavingsGoalPatch,
    SavingsGoalResponse,
)

GOAL_TYPE = "savings"
_STATUS_ORDER = {"active": 0, "completed": 1, "archived": 2}


def singapore_today() -> date:
    return datetime.now(ZoneInfo("Asia/Singapore")).date()


def weeks_until(target_date: date, today: date) -> int:
    """Whole weeks left, rounded up, never below 1 for a future date."""
    days = (target_date - today).days
    return max((days + 6) // 7, 1)


def suggested_weekly_cents(
    remaining_cents: int, target_date: date | None, today: date
) -> int | None:
    """``ceil(remaining / weeks_until(target_date))`` when a future date is set."""
    if target_date is None or remaining_cents <= 0 or target_date <= today:
        return None
    weeks = weeks_until(target_date, today)
    return -(-remaining_cents // weeks)


def list_goals(session: Session, user_id: UUID) -> list[SavingsGoalResponse]:
    goals = session.scalars(
        select(SavingsGoal).where(
            SavingsGoal.user_id == user_id, SavingsGoal.goal_type == GOAL_TYPE
        )
    ).all()
    # Active first, then completed, then archived; newest first within a status.
    ordered = sorted(goals, key=lambda goal: goal.created_at, reverse=True)
    ordered.sort(key=lambda goal: _STATUS_ORDER.get(goal.status, len(_STATUS_ORDER)))
    today = singapore_today()
    return [_response(goal, today) for goal in ordered]


def create_goal(session: Session, user_id: UUID, payload: SavingsGoalCreate) -> SavingsGoalResponse:
    ensure_profile(session, user_id)
    goal = SavingsGoal(
        id=uuid4(),
        user_id=user_id,
        goal_type=GOAL_TYPE,
        name=payload.name,
        target_cents=payload.target_cents,
        target_date=payload.target_date,
        status="active",
        settings={},
    )
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return _response(goal)


def patch_goal(
    session: Session, user_id: UUID, goal_id: UUID, payload: SavingsGoalPatch
) -> SavingsGoalResponse:
    goal = _owned_goal(session, user_id, goal_id)
    if payload.name is not None:
        goal.name = payload.name
    if payload.target_cents is not None:
        goal.target_cents = payload.target_cents
    if "target_date" in payload.model_fields_set:
        goal.target_date = payload.target_date
    if payload.status is not None:
        goal.status = payload.status
    session.commit()
    session.refresh(goal)
    return _response(goal)


def delete_goal(session: Session, user_id: UUID, goal_id: UUID) -> None:
    session.delete(_owned_goal(session, user_id, goal_id))
    session.commit()


def add_contribution(
    session: Session,
    user_id: UUID,
    goal_id: UUID,
    payload: SavingsGoalContributionCreate,
    today: date | None = None,
) -> SavingsGoalResponse:
    goal = _owned_goal(session, user_id, goal_id)
    if payload.contributed_on > (today or singapore_today()):
        raise DomainError(
            422,
            "VALIDATION_ERROR",
            "Check the highlighted fields.",
            field_errors={"contributedOn": "Contribution date cannot be in the future."},
        )
    session.add(
        SavingsGoalContribution(
            id=uuid4(),
            goal_id=goal.id,
            user_id=user_id,
            amount_cents=payload.amount_cents,
            contributed_on=payload.contributed_on,
            note=payload.note,
        )
    )
    session.commit()
    session.refresh(goal)
    return _response(goal)


def delete_contribution(
    session: Session, user_id: UUID, goal_id: UUID, contribution_id: UUID
) -> None:
    goal = _owned_goal(session, user_id, goal_id)
    contribution = session.get(SavingsGoalContribution, contribution_id)
    if contribution is None or contribution.user_id != user_id or contribution.goal_id != goal.id:
        raise DomainError(404, "NOT_FOUND", "Savings goal contribution not found.")
    session.delete(contribution)
    session.commit()


def _owned_goal(session: Session, user_id: UUID, goal_id: UUID) -> SavingsGoal:
    goal = session.get(SavingsGoal, goal_id)
    if goal is None or goal.user_id != user_id or goal.goal_type != GOAL_TYPE:
        raise DomainError(404, "NOT_FOUND", "Savings goal not found.")
    return goal


def _response(goal: SavingsGoal, today: date | None = None) -> SavingsGoalResponse:
    today = today or singapore_today()
    saved = sum(item.amount_cents for item in goal.contributions)
    remaining = max(goal.target_cents - saved, 0)
    return SavingsGoalResponse(
        id=goal.id,
        name=goal.name,
        target_cents=goal.target_cents,
        target_date=goal.target_date,
        status=goal.status,
        saved_cents=saved,
        remaining_cents=remaining,
        reached=saved >= goal.target_cents,
        suggested_weekly_cents=suggested_weekly_cents(remaining, goal.target_date, today),
        contributions=[
            SavingsGoalContributionResponse(
                id=item.id,
                amount_cents=item.amount_cents,
                contributed_on=item.contributed_on,
                note=item.note,
                created_at=item.created_at,
            )
            for item in sorted(
                goal.contributions,
                key=lambda item: (item.contributed_on, item.created_at),
                reverse=True,
            )
        ],
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )
