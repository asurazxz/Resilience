"""Database-backed checks for the emergency-fund model.

``documentation/features/emergency-fund-model.md`` is the specification.
"""

from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from backend.app.db.session import get_engine
from backend.app.features.emergency_fund_ledger import (
    emergency_fund_balance,
    weekly_essential_expenses_cents,
    weekly_recurring_work_costs_cents,
)
from backend.tests.integration.db_support import (
    last_monday,
    requires_database,
    singapore_today,
    throwaway_session,
    throwaway_user,
)

pytestmark = requires_database


def _week_payload(emergency_savings_cents: int) -> dict:
    return {
        "id": str(uuid4()),
        "expectedRevision": None,
        "hadNoIncome": False,
        "emergencySavingsCents": emergency_savings_cents,
        "status": "confirmed",
        "earnings": [
            {
                "id": str(uuid4()),
                "platformCode": "grab",
                "platformLabel": None,
                "amountCents": 40_000,
            }
        ],
        "variableCosts": [],
        "inputSnapshots": [],
    }


def test_saving_a_week_never_moves_the_emergency_fund_balance() -> None:
    """The double-count regression: saving a week used to add ``N`` twice."""
    with throwaway_user() as (client, _user_id):
        opening = client.put(
            "/api/v1/resilience-jar/opening-balance", json={"amount_cents": 100_000}
        )
        assert opening.status_code == 200, opening.text

        deposit = client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 5_000, "contribution_date": singapore_today().isoformat()},
        )
        assert deposit.status_code == 201, deposit.text

        before = client.get("/api/v1/foundation/bootstrap").json()["profile"]
        assert before["emergencyFundBalanceCents"] == 105_000
        assert before["latestEmergencySavingsCents"] == 100_000

        week_start = last_monday().isoformat()
        saved = client.put(
            f"/api/v1/foundation/weeks/{week_start}",
            headers={"Idempotency-Key": str(uuid4())},
            json=_week_payload(105_000),
        )
        assert saved.status_code == 200, saved.text

        after = client.get("/api/v1/foundation/bootstrap").json()["profile"]
        # Before the fix this was 110_000.
        assert after["emergencyFundBalanceCents"] == 105_000
        assert after["latestEmergencySavingsCents"] == 100_000

        summary = client.get("/api/v1/resilience-jar/summary").json()
        assert summary["progress"]["contribution_total_cents"] == 105_000


def test_ledger_functions_agree_with_the_recorded_rows() -> None:
    with throwaway_user() as (client, user_id):
        client.put("/api/v1/resilience-jar/opening-balance", json={"amount_cents": 50_000})
        client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 20_000, "contribution_date": singapore_today().isoformat()},
        )
        client.post(
            "/api/v1/resilience-jar/withdrawals",
            json={"amount_cents": 5_000, "contribution_date": singapore_today().isoformat()},
        )
        rent_id, food_id, rental_id = str(uuid4()), str(uuid4()), str(uuid4())
        client.put(
            f"/api/v1/foundation/essential-expenses/{rent_id}",
            json={
                "id": rent_id,
                "category": "housing",
                "label": "Rent",
                "amountCents": 80_000,
                "cadence": "monthly",
                "isActive": True,
            },
        )
        client.put(
            f"/api/v1/foundation/essential-expenses/{food_id}",
            json={
                "id": food_id,
                "category": "food",
                "label": "Food",
                "amountCents": 12_000,
                "cadence": "weekly",
                "isActive": True,
            },
        )
        client.put(
            f"/api/v1/foundation/recurring-work-costs/{rental_id}",
            json={
                "id": rental_id,
                "category": "vehicle_rental",
                "label": "Van",
                "amountCents": 30_000,
                "cadence": "weekly",
                "isActive": True,
            },
        )

        with Session(get_engine()) as session:
            assert emergency_fund_balance(session, user_id) == 65_000
            # The worked example in the model document: 80000*12//52 + 12000.
            assert weekly_essential_expenses_cents(session, user_id) == 30_461
            # Work costs stay out of E.
            assert weekly_recurring_work_costs_cents(session, user_id) == 30_000


def test_ledger_reports_zero_and_none_for_an_empty_user() -> None:
    with throwaway_session() as (session, user_id):
        assert emergency_fund_balance(session, user_id) == 0
        assert weekly_essential_expenses_cents(session, user_id) is None
        assert weekly_recurring_work_costs_cents(session, user_id) == 0


def test_foundation_transactions_round_trip_and_are_user_scoped() -> None:
    with throwaway_user() as (client, _user_id):
        created = client.post(
            "/api/v1/foundation/transactions",
            json={
                "entryType": "income",
                "amountCents": 25_000,
                "description": "  Saturday shift  ",
                "occurredOn": singapore_today().isoformat(),
            },
        )
        assert created.status_code == 201, created.text
        transaction_id = created.json()["id"]
        assert created.json()["description"] == "Saturday shift"

        listed = client.get("/api/v1/foundation/bootstrap").json()["transactions"]
        assert [item["id"] for item in listed] == [transaction_id]

        with throwaway_user() as (other_client, _other_id):
            stranger = other_client.delete(f"/api/v1/foundation/transactions/{transaction_id}")
            assert stranger.status_code == 404
            assert stranger.json()["error"]["code"] == "NOT_FOUND"
            assert other_client.get("/api/v1/foundation/bootstrap").json()["transactions"] == []

        removed = client.delete(f"/api/v1/foundation/transactions/{transaction_id}")
        assert removed.status_code == 204
        assert client.get("/api/v1/foundation/bootstrap").json()["transactions"] == []


def test_future_transaction_date_is_rejected() -> None:
    with throwaway_user() as (client, _user_id):
        response = client.post(
            "/api/v1/foundation/transactions",
            json={"entryType": "income", "amountCents": 100, "occurredOn": "2999-01-01"},
        )

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"
