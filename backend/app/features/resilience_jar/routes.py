from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ...core.auth import current_user_id
from ...db.session import get_session
from ..foundation_input.service import ensure_profile
from .schemas import ContributionPatch, ContributionWrite, OpeningBalanceRequest, PlanPatch
from .serializers import contribution_dict, summary_dict
from .service import ResilienceJarService
from .sql_repositories import (
    SqlContributionRepository,
    SqlFinancialContextRepository,
    SqlPlanRepository,
)

SessionDep = Annotated[Session, Depends(get_session)]


def create_router(
    service_override: ResilienceJarService | None = None,
    *,
    user_id_provider: Callable[[], str] | None = None,
) -> APIRouter:
    """Create the feature router without coupling it to shared app composition."""

    router = APIRouter(prefix="/resilience-jar", tags=["resilience-jar"])
    user_dependency = (
        (lambda: user_id_provider()) if user_id_provider is not None else current_user_id
    )
    UserDep = Annotated[UUID, Depends(user_dependency)]

    def service(session: Session, user_id: UUID) -> ResilienceJarService:
        if service_override is not None:
            return service_override
        ensure_profile(session, user_id)
        return ResilienceJarService(
            SqlPlanRepository(session),
            SqlContributionRepository(session),
            SqlFinancialContextRepository(session),
        )

    @router.get("/summary")
    def get_summary(session: SessionDep, user_id: UserDep):
        return summary_dict(service(session, user_id).get_summary(str(user_id)))

    @router.patch("/plan")
    def patch_plan(payload: PlanPatch, session: SessionDep, user_id: UserDep):
        return summary_dict(service(session, user_id).patch_plan(str(user_id), payload))

    @router.put("/opening-balance")
    def set_opening_balance(
        payload: OpeningBalanceRequest, session: SessionDep, user_id: UserDep
    ):
        return summary_dict(service(session, user_id).set_opening_balance(str(user_id), payload))

    @router.post("/contributions", status_code=201)
    def create_contribution(payload: ContributionWrite, session: SessionDep, user_id: UserDep):
        return contribution_dict(
            service(session, user_id).create_contribution(str(user_id), payload)
        )

    @router.post("/withdrawals", status_code=201)
    def create_withdrawal(payload: ContributionWrite, session: SessionDep, user_id: UserDep):
        return contribution_dict(service(session, user_id).create_withdrawal(str(user_id), payload))

    @router.patch("/contributions/{contribution_id}")
    def update_contribution(
        contribution_id: UUID,
        payload: ContributionPatch,
        session: SessionDep,
        user_id: UserDep,
    ):
        return contribution_dict(
            service(session, user_id).update_contribution(
                str(user_id), str(contribution_id), payload
            )
        )

    @router.delete("/contributions/{contribution_id}", status_code=204)
    def delete_contribution(contribution_id: UUID, session: SessionDep, user_id: UserDep):
        service(session, user_id).delete_contribution(str(user_id), str(contribution_id))
        return Response(status_code=204)

    return router
