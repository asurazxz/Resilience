from datetime import date
from pathlib import Path
from typing import Annotated
from uuid import UUID, uuid4

from backend.app.core.settings import Settings, get_settings
from backend.app.db.models import EssentialExpense, RecurringWorkCost
from backend.app.db.session import get_session
from backend.app.features.foundation_input.csv_import import parse_csv_preview
from backend.app.features.foundation_input.schemas import (
    CsvPreviewResponse,
    EssentialExpenseInput,
    EssentialExpenseResponse,
    FoundationBootstrap,
    OnboardingRequest,
    ProfileResponse,
    ProfileUpdate,
    RecurringWorkCostInput,
    RecurringWorkCostResponse,
    WeeklyEntryResponse,
    WeeklyEntryUpsert,
)
from backend.app.features.foundation_input.service import (
    complete_onboarding,
    delete_owned,
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
from fastapi import APIRouter, Depends, File, Header, Query, UploadFile
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session

router = APIRouter(prefix="/foundation", tags=["foundation-input"])


def demo_user(settings: Annotated[Settings, Depends(get_settings)]) -> UUID:
    return settings.demo_user_id


SessionDep = Annotated[Session, Depends(get_session)]
UserDep = Annotated[UUID, Depends(demo_user)]


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


@router.get("/imports/csv/template", response_class=PlainTextResponse)
def csv_template() -> PlainTextResponse:
    fixture = Path(__file__).parents[4] / "contracts" / "fixtures" / "foundation-input-template.csv"
    return PlainTextResponse(
        fixture.read_text(encoding="utf-8"),
        headers={
            "Content-Disposition": 'attachment; filename="resilience-foundation-template.csv"'
        },
    )


@router.post("/imports/csv/preview", response_model=CsvPreviewResponse)
async def csv_preview(file: Annotated[UploadFile, File()]) -> CsvPreviewResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise ValueError("Upload a .csv file")
    return parse_csv_preview(file.filename, await file.read())


@router.delete("/data", response_model=FoundationBootstrap)
def data_reset(
    confirm: Annotated[str, Header(alias="X-Confirm-Reset")],
    session: SessionDep,
    user_id: UserDep,
) -> FoundationBootstrap:
    if confirm != "RESET DEMO DATA":
        raise ValueError("X-Confirm-Reset must be RESET DEMO DATA")
    return reset_demo_data(session, user_id)
