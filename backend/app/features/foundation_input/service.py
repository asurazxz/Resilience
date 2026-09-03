import hashlib
import json
from datetime import UTC, date, datetime
from uuid import UUID, uuid4

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from backend.app.core.errors import DomainError
from backend.app.db.models import (
    EmergencySavingsSnapshot,
    EssentialExpense,
    IdempotencyReceipt,
    Profile,
    RecurringWorkCost,
    Transaction,
    WeeklyEarning,
    WeeklyEntry,
    WeeklyInputSnapshot,
    WeeklyVariableCost,
)
from backend.app.features.emergency_fund_ledger import emergency_fund_balance
from backend.app.features.foundation_input.schemas import (
    EssentialExpenseInput,
    EssentialExpenseResponse,
    FoundationBootstrap,
    InputSnapshot,
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


def ensure_profile(session: Session, user_id: UUID) -> Profile:
    profile = session.get(Profile, user_id)
    if profile is not None:
        return profile
    profile = Profile(id=user_id)
    session.add(profile)
    try:
        session.flush()
    except IntegrityError:
        # A concurrent request created the row first; adopt theirs.
        session.rollback()
        profile = session.get(Profile, user_id)
        if profile is None:
            raise
    return profile


def get_bootstrap(session: Session, user_id: UUID) -> FoundationBootstrap:
    profile = ensure_profile(session, user_id)
    recurring = session.scalars(
        select(RecurringWorkCost)
        .where(RecurringWorkCost.user_id == user_id)
        .order_by(RecurringWorkCost.created_at, RecurringWorkCost.id)
    ).all()
    essentials = session.scalars(
        select(EssentialExpense)
        .where(EssentialExpense.user_id == user_id)
        .order_by(EssentialExpense.created_at, EssentialExpense.id)
    ).all()
    weeks = session.scalars(_week_query(user_id).limit(12)).unique().all()
    transactions = session.scalars(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.occurred_on.desc(), Transaction.created_at.desc())
        .limit(100)
    ).all()
    return FoundationBootstrap(
        profile=_profile_response(profile, emergency_fund_balance(session, user_id)),
        recurring_work_costs=[_recurring_response(item) for item in recurring],
        essential_expenses=[_essential_response(item) for item in essentials],
        weekly_entries=[_week_response(item) for item in weeks],
        transactions=[_transaction_response(item) for item in transactions],
        synced_at=datetime.now(UTC),
    )


def complete_onboarding(
    session: Session, user_id: UUID, payload: OnboardingRequest
) -> FoundationBootstrap:
    profile = ensure_profile(session, user_id)
    session.execute(delete(RecurringWorkCost).where(RecurringWorkCost.user_id == user_id))
    session.execute(delete(EssentialExpense).where(EssentialExpense.user_id == user_id))
    for item in payload.recurring_work_costs:
        session.add(_recurring_model(user_id, item))
    for item in payload.essential_expenses:
        session.add(_essential_model(user_id, item))
    profile.latest_emergency_savings_cents = payload.emergency_savings_cents
    profile.onboarding_completed_at = datetime.now(UTC)
    if payload.first_week and payload.first_week_start:
        _upsert_week(session, user_id, payload.first_week_start, payload.first_week)
    session.commit()
    return get_bootstrap(session, user_id)


def update_profile(session: Session, user_id: UUID, payload: ProfileUpdate) -> ProfileResponse:
    profile = ensure_profile(session, user_id)
    if "display_name" in payload.model_fields_set:
        profile.display_name = _optional_text(payload.display_name)
    if "phone_number" in payload.model_fields_set:
        profile.phone_number = _optional_text(payload.phone_number)
    if "date_of_birth" in payload.model_fields_set:
        profile.date_of_birth = payload.date_of_birth
    session.commit()
    session.refresh(profile)
    return _profile_response(profile, emergency_fund_balance(session, user_id))


def create_transaction(
    session: Session, user_id: UUID, payload: TransactionInput
) -> TransactionResponse:
    ensure_profile(session, user_id)
    transaction = Transaction(
        id=uuid4(),
        user_id=user_id,
        entry_type=payload.entry_type,
        amount_cents=payload.amount_cents,
        description=_optional_text(payload.description),
        occurred_on=payload.occurred_on,
    )
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return _transaction_response(transaction)


def delete_transaction(session: Session, user_id: UUID, transaction_id: UUID) -> None:
    transaction = session.get(Transaction, transaction_id)
    if transaction is None or transaction.user_id != user_id:
        raise DomainError(404, "NOT_FOUND", "Transaction not found.")
    session.delete(transaction)
    session.commit()


def put_recurring_cost(
    session: Session, user_id: UUID, item_id: UUID, payload: RecurringWorkCostInput
) -> RecurringWorkCostResponse:
    if item_id != payload.id:
        raise DomainError(400, "ID_MISMATCH", "Path and payload IDs must match.")
    existing = session.get(RecurringWorkCost, item_id)
    if existing and existing.user_id != user_id:
        raise DomainError(404, "NOT_FOUND", "Recurring work cost not found.")
    if existing is None:
        existing = _recurring_model(user_id, payload)
        session.add(existing)
    else:
        _apply_recurring(existing, payload)
    session.commit()
    session.refresh(existing)
    return _recurring_response(existing)


def put_essential_expense(
    session: Session, user_id: UUID, item_id: UUID, payload: EssentialExpenseInput
) -> EssentialExpenseResponse:
    if item_id != payload.id:
        raise DomainError(400, "ID_MISMATCH", "Path and payload IDs must match.")
    existing = session.get(EssentialExpense, item_id)
    if existing and existing.user_id != user_id:
        raise DomainError(404, "NOT_FOUND", "Essential expense not found.")
    if existing is None:
        existing = _essential_model(user_id, payload)
        session.add(existing)
    else:
        _apply_essential(existing, payload)
    session.commit()
    session.refresh(existing)
    return _essential_response(existing)


def delete_owned(session: Session, user_id: UUID, model: type, item_id: UUID) -> None:
    item = session.get(model, item_id)
    if item is None:
        return
    if item.user_id != user_id:
        raise DomainError(404, "NOT_FOUND", "Record not found.")
    session.delete(item)
    session.commit()


def list_weeks(
    session: Session, user_id: UUID, limit: int = 20, before: date | None = None
) -> list[WeeklyEntryResponse]:
    statement = _week_query(user_id)
    if before:
        statement = statement.where(WeeklyEntry.week_start < before)
    weeks = session.scalars(statement.limit(limit)).unique().all()
    return [_week_response(item) for item in weeks]


def get_week(session: Session, user_id: UUID, week_start: date) -> WeeklyEntryResponse:
    week = session.scalar(_week_query(user_id).where(WeeklyEntry.week_start == week_start))
    if week is None:
        raise DomainError(404, "NOT_FOUND", "Weekly entry not found.")
    return _week_response(week)


def put_week(
    session: Session,
    user_id: UUID,
    week_start: date,
    payload: WeeklyEntryUpsert,
    idempotency_key: UUID,
) -> WeeklyEntryResponse:
    request_hash = hashlib.sha256(
        json.dumps(
            {"weekStart": week_start.isoformat(), **payload.model_dump(mode="json", by_alias=True)},
            sort_keys=True,
        ).encode()
    ).hexdigest()
    receipt = session.scalar(
        select(IdempotencyReceipt).where(
            IdempotencyReceipt.user_id == user_id,
            IdempotencyReceipt.idempotency_key == idempotency_key,
        )
    )
    if receipt:
        if receipt.request_hash != request_hash:
            raise DomainError(
                409,
                "IDEMPOTENCY_KEY_REUSED",
                "This idempotency key was already used for a different request.",
            )
        return WeeklyEntryResponse.model_validate(receipt.response_body)

    result = _upsert_week(session, user_id, week_start, payload)
    response = _week_response(result)
    session.add(
        IdempotencyReceipt(
            user_id=user_id,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            response_status=200,
            response_body=response.model_dump(mode="json", by_alias=True),
        )
    )
    try:
        session.commit()
    except IntegrityError:
        # A concurrent retry with the same key won the race; return its result.
        session.rollback()
        receipt = session.scalar(
            select(IdempotencyReceipt).where(
                IdempotencyReceipt.user_id == user_id,
                IdempotencyReceipt.idempotency_key == idempotency_key,
            )
        )
        if receipt is None:
            raise
        if receipt.request_hash != request_hash:
            raise DomainError(
                409,
                "IDEMPOTENCY_KEY_REUSED",
                "This idempotency key was already used for a different request.",
            ) from None
        return WeeklyEntryResponse.model_validate(receipt.response_body)
    return response


def delete_week(session: Session, user_id: UUID, week_start: date) -> None:
    week = session.scalar(
        select(WeeklyEntry).where(
            WeeklyEntry.user_id == user_id, WeeklyEntry.week_start == week_start
        )
    )
    if week is None:
        return
    session.delete(week)
    session.commit()


def reset_demo_data(session: Session, user_id: UUID) -> FoundationBootstrap:
    profile = session.get(Profile, user_id)
    if profile:
        session.delete(profile)
        session.flush()
    session.add(Profile(id=user_id))
    session.commit()
    return get_bootstrap(session, user_id)


def _upsert_week(
    session: Session, user_id: UUID, week_start: date, payload: WeeklyEntryUpsert
) -> WeeklyEntry:
    if week_start.weekday() != 0:
        raise DomainError(422, "INVALID_WEEK_START", "weekStart must be a Monday.")
    existing = session.scalar(
        _week_query(user_id).where(WeeklyEntry.week_start == week_start).with_for_update()
    )
    record_with_same_id = session.scalar(_week_query(user_id).where(WeeklyEntry.id == payload.id))
    if record_with_same_id and record_with_same_id.week_start != week_start:
        raise DomainError(
            409,
            "WEEK_ID_CONFLICT",
            "This entry is already associated with another week.",
            {
                "serverRecord": _week_response(record_with_same_id).model_dump(
                    mode="json", by_alias=True
                )
            },
        )
    if existing is None:
        for model, item_ids in (
            (WeeklyEarning, [item.id for item in payload.earnings]),
            (WeeklyVariableCost, [item.id for item in payload.variable_costs]),
            (WeeklyInputSnapshot, [item.id for item in payload.input_snapshots]),
        ):
            if item_ids and session.scalar(select(model.id).where(model.id.in_(item_ids))):
                raise DomainError(
                    409,
                    "ENTRY_ITEM_ID_CONFLICT",
                    "An earnings or cost item is already associated with another week.",
                )
    if existing:
        if payload.id != existing.id:
            raise DomainError(
                409, "WEEK_ID_CONFLICT", "That week already has a different record ID."
            )
        if payload.expected_revision != existing.revision:
            raise DomainError(
                409,
                "REVISION_CONFLICT",
                "The weekly entry changed on the server.",
                {"serverRecord": _week_response(existing).model_dump(mode="json", by_alias=True)},
            )
        existing.earnings.clear()
        existing.variable_costs.clear()
        existing.input_snapshots.clear()
        existing.revision += 1
        week = existing
    else:
        if payload.expected_revision is not None:
            raise DomainError(409, "REVISION_CONFLICT", "The weekly entry no longer exists.")
        week = WeeklyEntry(id=payload.id, user_id=user_id, week_start=week_start, revision=1)
        session.add(week)

    week.had_no_income = payload.had_no_income
    week.emergency_savings_cents = payload.emergency_savings_cents
    week.status = payload.status
    week.earnings = [
        WeeklyEarning(
            id=item.id,
            platform_code=item.platform_code,
            platform_label=item.platform_label,
            amount_cents=item.amount_cents,
        )
        for item in payload.earnings
    ]
    week.variable_costs = [
        WeeklyVariableCost(
            id=item.id, category=item.category, label=item.label, amount_cents=item.amount_cents
        )
        for item in payload.variable_costs
    ]
    week.input_snapshots = [
        WeeklyInputSnapshot(
            id=item.id,
            source_id=item.source_id,
            input_kind=item.input_kind,
            category=item.category,
            label=item.label,
            amount_cents=item.amount_cents,
            cadence=item.cadence,
        )
        for item in payload.input_snapshots
    ]
    # The weekly figure is a historical snapshot only. Writing it back into the
    # profile's opening balance is what caused the emergency-fund double count.
    ensure_profile(session, user_id)
    session.flush()
    snapshot = session.scalar(
        select(EmergencySavingsSnapshot).where(
            EmergencySavingsSnapshot.source_weekly_entry_id == week.id
        )
    )
    if snapshot:
        snapshot.amount_cents = payload.emergency_savings_cents
        snapshot.recorded_at = datetime.now(UTC)
    else:
        session.add(
            EmergencySavingsSnapshot(
                id=uuid4(),
                user_id=user_id,
                source_weekly_entry_id=week.id,
                amount_cents=payload.emergency_savings_cents,
            )
        )
    session.flush()
    return week


def _week_query(user_id: UUID):
    return (
        select(WeeklyEntry)
        .where(WeeklyEntry.user_id == user_id)
        .options(
            selectinload(WeeklyEntry.earnings),
            selectinload(WeeklyEntry.variable_costs),
            selectinload(WeeklyEntry.input_snapshots),
        )
        .order_by(WeeklyEntry.week_start.desc(), WeeklyEntry.id)
    )


def _profile_response(
    profile: Profile, emergency_fund_balance_cents: int | None = None
) -> ProfileResponse:
    """``latestEmergencySavingsCents`` is the stored opening balance ``O``.

    ``emergencyFundBalanceCents`` is the derived balance ``B`` and is the value
    every screen should show. It falls back to ``O`` only where no session is
    available to aggregate the ledger (the profile PATCH response).
    """
    return ProfileResponse(
        id=profile.id,
        currency=profile.currency,
        timezone=profile.timezone,
        onboarding_completed=profile.onboarding_completed_at is not None,
        latest_emergency_savings_cents=profile.latest_emergency_savings_cents,
        emergency_fund_balance_cents=(
            profile.latest_emergency_savings_cents
            if emergency_fund_balance_cents is None
            else emergency_fund_balance_cents
        ),
        display_name=profile.display_name,
        phone_number=profile.phone_number,
        date_of_birth=profile.date_of_birth,
    )


def _recurring_model(user_id: UUID, item: RecurringWorkCostInput) -> RecurringWorkCost:
    return RecurringWorkCost(user_id=user_id, **item.model_dump())


def _essential_model(user_id: UUID, item: EssentialExpenseInput) -> EssentialExpense:
    return EssentialExpense(user_id=user_id, **item.model_dump())


def _apply_recurring(model: RecurringWorkCost, item: RecurringWorkCostInput) -> None:
    for key, value in item.model_dump(exclude={"id"}).items():
        setattr(model, key, value)


def _apply_essential(model: EssentialExpense, item: EssentialExpenseInput) -> None:
    for key, value in item.model_dump(exclude={"id"}).items():
        setattr(model, key, value)


def _recurring_response(item: RecurringWorkCost) -> RecurringWorkCostResponse:
    return RecurringWorkCostResponse.model_validate(item)


def _essential_response(item: EssentialExpense) -> EssentialExpenseResponse:
    return EssentialExpenseResponse.model_validate(item)


def _transaction_response(item: Transaction) -> TransactionResponse:
    return TransactionResponse.model_validate(item)


def _optional_text(value: str | None) -> str | None:
    return value.strip() if value and value.strip() else None


def _week_response(week: WeeklyEntry) -> WeeklyEntryResponse:
    return WeeklyEntryResponse(
        id=week.id,
        week_start=week.week_start,
        had_no_income=week.had_no_income,
        emergency_savings_cents=week.emergency_savings_cents,
        status=week.status,
        revision=week.revision,
        earnings=[
            {
                "id": item.id,
                "platformCode": item.platform_code,
                "platformLabel": item.platform_label,
                "amountCents": item.amount_cents,
            }
            for item in week.earnings
        ],
        variable_costs=[
            {
                "id": item.id,
                "category": item.category,
                "label": item.label,
                "amountCents": item.amount_cents,
            }
            for item in week.variable_costs
        ],
        input_snapshots=[
            InputSnapshot(
                id=item.id,
                source_id=item.source_id,
                input_kind=item.input_kind,
                category=item.category,
                label=item.label,
                amount_cents=item.amount_cents,
                cadence=item.cadence,
            )
            for item in week.input_snapshots
        ],
        created_at=week.created_at,
        updated_at=week.updated_at,
    )
