from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.app.core.auth import current_user_id
from backend.app.db.session import get_session
from backend.app.features.savings_goals import service
from backend.app.features.savings_goals.schemas import (
    SavingsGoalContributionCreate,
    SavingsGoalCreate,
    SavingsGoalListResponse,
    SavingsGoalPatch,
    SavingsGoalResponse,
)

router = APIRouter(prefix="/savings-goals", tags=["savings-goals"])

SessionDep = Annotated[Session, Depends(get_session)]
UserDep = Annotated[UUID, Depends(current_user_id)]


@router.get("", response_model=SavingsGoalListResponse)
def list_goals(session: SessionDep, user_id: UserDep) -> SavingsGoalListResponse:
    return SavingsGoalListResponse(goals=service.list_goals(session, user_id))


@router.post("", response_model=SavingsGoalResponse, status_code=201)
def create_goal(
    payload: SavingsGoalCreate, session: SessionDep, user_id: UserDep
) -> SavingsGoalResponse:
    return service.create_goal(session, user_id, payload)


@router.patch("/{goal_id}", response_model=SavingsGoalResponse)
def patch_goal(
    goal_id: UUID, payload: SavingsGoalPatch, session: SessionDep, user_id: UserDep
) -> SavingsGoalResponse:
    return service.patch_goal(session, user_id, goal_id, payload)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: UUID, session: SessionDep, user_id: UserDep) -> Response:
    service.delete_goal(session, user_id, goal_id)
    return Response(status_code=204)


@router.post("/{goal_id}/contributions", response_model=SavingsGoalResponse, status_code=201)
def add_contribution(
    goal_id: UUID,
    payload: SavingsGoalContributionCreate,
    session: SessionDep,
    user_id: UserDep,
) -> SavingsGoalResponse:
    return service.add_contribution(session, user_id, goal_id, payload)


@router.delete("/{goal_id}/contributions/{contribution_id}", status_code=204)
def delete_contribution(
    goal_id: UUID, contribution_id: UUID, session: SessionDep, user_id: UserDep
) -> Response:
    service.delete_contribution(session, user_id, goal_id, contribution_id)
    return Response(status_code=204)
