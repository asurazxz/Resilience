from datetime import date
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.app.core.auth import current_user_id
from backend.app.core.errors import DomainError
from backend.app.db.models import EssentialExpense, RecurringWorkCost
from backend.app.db.session import get_session
from backend.app.features.foundation_input.schemas import (
    EssentialExpenseInput,
    EssentialExpenseResponse,
    FoundationBootstrap,
    OnboardingRequest,
    ProfileResponse,
    ProfileUpdate,
    RecurringWorkCostInput,
    RecurringWorkCostResponse,
    TransactionInput,
    TransactionResponse,
    WeeklyEntryResponse,
    WeeklyEntryUpsert,
)
from backend.app.features.foundation_input.service import (
    complete_onboarding,
    create_transaction,
    delete_owned,
    delete_transaction,
    delete_week,
    get_bootstrap,
    get_week,
    list_weeks,
    put_essential_expense,
    put_recurring_cost,
    put_week,
    reset_demo_data,
    update_profile,
)

router = APIRouter(prefix="/foundation", tags=["foundation-input"])


SessionDep = Annotated[Session, Depends(get_session)]
UserDep = Annotated[UUID, Depends(current_user_id)]


@router.get("/bootstrap", response_model=FoundationBootstrap)
def bootstrap(session: SessionDep, user_id: UserDep) -> FoundationBootstrap:
    return get_bootstrap(session, user_id)


@router.put("/onboarding", response_model=FoundationBootstrap)
def onboarding(
    payload: OnboardingRequest,
    session: SessionDep,
    user_id: UserDep,
) -> FoundationBootstrap:
    return complete_onboarding(session, user_id, payload)


@router.patch("/profile", response_model=ProfileResponse)
def profile_update(
    payload: ProfileUpdate,
    session: SessionDep,
    user_id: UserDep,
) -> ProfileResponse:
    return update_profile(session, user_id, payload)


@router.put("/recurring-work-costs/{item_id}", response_model=RecurringWorkCostResponse)
def recurring_put(
    item_id: UUID,
    payload: RecurringWorkCostInput,
    session: SessionDep,
    user_id: UserDep,
) -> RecurringWorkCostResponse:
    return put_recurring_cost(session, user_id, item_id, payload)


@router.delete("/recurring-work-costs/{item_id}", status_code=204)
def recurring_delete(
    item_id: UUID,
    session: SessionDep,
    user_id: UserDep,
) -> Response:
    delete_owned(session, user_id, RecurringWorkCost, item_id)
    return Response(status_code=204)


@router.put("/essential-expenses/{item_id}", response_model=EssentialExpenseResponse)
def essential_put(
    item_id: UUID,
    payload: EssentialExpenseInput,
    session: SessionDep,
    user_id: UserDep,
) -> EssentialExpenseResponse:
    return put_essential_expense(session, user_id, item_id, payload)


@router.delete("/essential-expenses/{item_id}", status_code=204)
def essential_delete(
    item_id: UUID,
    session: SessionDep,
    user_id: UserDep,
) -> Response:
    delete_owned(session, user_id, EssentialExpense, item_id)
    return Response(status_code=204)


@router.get("/weeks", response_model=list[WeeklyEntryResponse])
def weeks_list(
    session: SessionDep,
    user_id: UserDep,
    limit: int = Query(default=20, ge=1, le=50),
    before: date | None = None,
) -> list[WeeklyEntryResponse]:
    return list_weeks(session, user_id, limit, before)


@router.get("/weeks/{week_start}", response_model=WeeklyEntryResponse)
def week_get(
    week_start: date,
    session: SessionDep,
    user_id: UserDep,
) -> WeeklyEntryResponse:
    return get_week(session, user_id, week_start)


@router.put("/weeks/{week_start}", response_model=WeeklyEntryResponse)
def week_put(
    week_start: date,
    payload: WeeklyEntryUpsert,
    session: SessionDep,
    user_id: UserDep,
    idempotency_key: Annotated[UUID | None, Header(alias="Idempotency-Key")] = None,
) -> WeeklyEntryResponse:
    return put_week(session, user_id, week_start, payload, idempotency_key or uuid4())


@router.delete("/weeks/{week_start}", status_code=204)
def week_delete(
    week_start: date,
    session: SessionDep,
    user_id: UserDep,
) -> Response:
    delete_week(session, user_id, week_start)
    return Response(status_code=204)


@router.post("/transactions", response_model=TransactionResponse, status_code=201)
def transaction_create(
    payload: TransactionInput, session: SessionDep, user_id: UserDep
) -> TransactionResponse:
    return create_transaction(session, user_id, payload)


@router.delete("/transactions/{transaction_id}", status_code=204)
def transaction_delete(transaction_id: UUID, session: SessionDep, user_id: UserDep) -> Response:
    delete_transaction(session, user_id, transaction_id)
    return Response(status_code=204)


@router.delete("/data", response_model=FoundationBootstrap)
def data_reset(
    confirm: Annotated[str, Header(alias="X-Confirm-Reset")],
    session: SessionDep,
    user_id: UserDep,
) -> FoundationBootstrap:
    if confirm != "RESET DEMO DATA":
        raise DomainError(
            422,
            "RESET_CONFIRMATION_REQUIRED",
            "X-Confirm-Reset must be RESET DEMO DATA.",
        )
    return reset_demo_data(session, user_id)
