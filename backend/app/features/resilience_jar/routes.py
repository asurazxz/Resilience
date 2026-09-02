from __future__ import annotations

from typing import Any, Callable

from .fixtures import DEMO_USER_ID, build_demo_service
from .serializers import contribution_dict, summary_dict
from .service import DomainError, ResilienceJarService


def create_router(
    service: ResilienceJarService,
    *,
    user_id_provider: Callable[[], str],
):
    """Create the feature router without coupling it to shared app composition."""
    from fastapi import APIRouter, Body, Depends, Response
    from fastapi.responses import JSONResponse

    router = APIRouter(prefix="/api/v1/resilience-jar", tags=["resilience-jar"])

    def error_response(error: DomainError) -> JSONResponse:
        return JSONResponse(status_code=error.status_code, content=error.as_dict())

    @router.get("/summary")
    def get_summary(user_id: str = Depends(user_id_provider)):
        try:
            return summary_dict(service.get_summary(user_id))
        except DomainError as error:
            return error_response(error)

    @router.patch("/plan")
    def patch_plan(
        payload: dict[str, Any] = Body(...),
        user_id: str = Depends(user_id_provider),
    ):
        try:
            return summary_dict(service.patch_plan(user_id, payload))
        except DomainError as error:
            return error_response(error)

    @router.post("/contributions", status_code=201)
    def create_contribution(
        payload: dict[str, Any] = Body(...),
        user_id: str = Depends(user_id_provider),
    ):
        try:
            return contribution_dict(service.create_contribution(user_id, payload))
        except DomainError as error:
            return error_response(error)

    @router.post("/withdrawals", status_code=201)
    def create_withdrawal(
        payload: dict[str, Any] = Body(...),
        user_id: str = Depends(user_id_provider),
    ):
        try:
            return contribution_dict(service.create_withdrawal(user_id, payload))
        except DomainError as error:
            return error_response(error)

    @router.patch("/contributions/{contribution_id}")
    def update_contribution(
        contribution_id: str,
        payload: dict[str, Any] = Body(...),
        user_id: str = Depends(user_id_provider),
    ):
        try:
            return contribution_dict(
                service.update_contribution(user_id, contribution_id, payload)
            )
        except DomainError as error:
            return error_response(error)

    @router.delete("/contributions/{contribution_id}", status_code=204)
    def delete_contribution(
        contribution_id: str, user_id: str = Depends(user_id_provider)
    ):
        try:
            service.delete_contribution(user_id, contribution_id)
            return Response(status_code=204)
        except DomainError as error:
            return error_response(error)

    return router


def create_demo_router():
    return create_router(
        build_demo_service(), user_id_provider=lambda: DEMO_USER_ID
    )
