import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

from .db_support import throwaway_user

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_DATABASE_TESTS") != "1",
    reason="set RUN_DATABASE_TESTS=1 with local Supabase running",
)


def test_bootstrap_and_week_revision_contract() -> None:
    client = TestClient(app)
    bootstrap = client.get("/api/v1/foundation/bootstrap")
    assert bootstrap.status_code == 200
    assert bootstrap.json()["profile"]["currency"] == "SGD"

    week_start = "2030-01-07"
    week_id = str(uuid4())
    earning_id = str(uuid4())
    payload = {
        "id": week_id,
        "expectedRevision": None,
        "hadNoIncome": False,
        "emergencySavingsCents": 125_000,
        "status": "confirmed",
        "earnings": [
            {
                "id": earning_id,
                "platformCode": "grab",
                "platformLabel": None,
                "amountCents": 42_050,
            }
        ],
        "variableCosts": [],
        "inputSnapshots": [],
    }

    try:
        client.delete(f"/api/v1/foundation/weeks/{week_start}")
        created = client.put(
            f"/api/v1/foundation/weeks/{week_start}",
            headers={"Idempotency-Key": str(uuid4())},
            json=payload,
        )
        assert created.status_code == 200, created.text
        assert created.json()["revision"] == 1

        conflict = client.put(
            f"/api/v1/foundation/weeks/{week_start}",
            headers={"Idempotency-Key": str(uuid4())},
            json={**payload, "expectedRevision": 99},
        )
        assert conflict.status_code == 409
        assert conflict.json()["error"]["code"] == "REVISION_CONFLICT"

        fetched = client.get(f"/api/v1/foundation/weeks/{week_start}")
        assert fetched.status_code == 200
        assert fetched.json()["earnings"][0]["amountCents"] == 42_050
    finally:
        client.delete(f"/api/v1/foundation/weeks/{week_start}")


def test_week_id_cannot_be_reused_for_a_different_week() -> None:
    client = TestClient(app)
    source_week = "2030-01-14"
    target_week = "2030-01-21"
    entry_id = str(uuid4())
    payload = {
        "id": entry_id,
        "expectedRevision": None,
        "hadNoIncome": False,
        "emergencySavingsCents": 125_000,
        "status": "confirmed",
        "earnings": [
            {
                "id": str(uuid4()),
                "platformCode": "grab",
                "platformLabel": None,
                "amountCents": 10_000,
            }
        ],
        "variableCosts": [],
        "inputSnapshots": [],
    }
    try:
        client.delete(f"/api/v1/foundation/weeks/{source_week}")
        client.delete(f"/api/v1/foundation/weeks/{target_week}")
        created = client.put(
            f"/api/v1/foundation/weeks/{source_week}",
            headers={"Idempotency-Key": str(uuid4())},
            json=payload,
        )
        assert created.status_code == 200, created.text
        duplicate_id = client.put(
            f"/api/v1/foundation/weeks/{target_week}",
            headers={"Idempotency-Key": str(uuid4())},
            json={
                **payload,
                "earnings": [
                    {
                        "id": str(uuid4()),
                        "platformCode": "grab",
                        "platformLabel": None,
                        "amountCents": 10_000,
                    }
                ],
            },
        )
        assert duplicate_id.status_code == 409, duplicate_id.text
        assert duplicate_id.json()["error"]["code"] == "WEEK_ID_CONFLICT"
    finally:
        client.delete(f"/api/v1/foundation/weeks/{target_week}")
        client.delete(f"/api/v1/foundation/weeks/{source_week}")


def test_reset_requires_confirmation_and_returns_empty_profile() -> None:
    client = TestClient(app)
    refused = client.delete("/api/v1/foundation/data")
    assert refused.status_code == 422

    reset = client.delete(
        "/api/v1/foundation/data",
        headers={"X-Confirm-Reset": "RESET DEMO DATA"},
    )
    assert reset.status_code == 200, reset.text
    assert reset.json()["profile"]["onboardingCompleted"] is False
    assert reset.json()["weeklyEntries"] == []


def test_brand_new_user_can_put_an_essential_expense_as_their_first_write() -> None:
    """Regression test: a brand-new user (no bootstrap call, no profile row
    yet) must be able to PUT an essential expense as their very first write.

    Previously this 500'd with a ``essential_expenses_user_id_fkey``
    ForeignKeyViolation, because nothing had ever committed a profiles row
    for the user.
    """
    with throwaway_user() as (client, _user_id):
        item_id = str(uuid4())
        response = client.put(
            f"/api/v1/foundation/essential-expenses/{item_id}",
            json={
                "id": item_id,
                "category": "food",
                "label": "Groceries",
                "amountCents": 10_000,
                "cadence": "weekly",
                "isActive": True,
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["amountCents"] == 10_000


def test_brand_new_user_can_put_a_recurring_work_cost_as_their_first_write() -> None:
    """Same regression as above, for the recurring-work-cost PUT endpoint."""
    with throwaway_user() as (client, _user_id):
        item_id = str(uuid4())
        response = client.put(
            f"/api/v1/foundation/recurring-work-costs/{item_id}",
            json={
                "id": item_id,
                "category": "vehicle_rental",
                "label": "Bike rental",
                "amountCents": 20_000,
                "cadence": "weekly",
                "isActive": True,
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["amountCents"] == 20_000


def test_bootstrap_alone_persists_the_profile_row() -> None:
    """A bootstrap call for a brand-new user must commit the profile it
    creates, not just flush it within the request's own transaction — a
    later request (a fresh session) must see the same profile, and be able
    to write against it without a foreign-key violation.
    """
    with throwaway_user() as (client, user_id):
        bootstrap = client.get("/api/v1/foundation/bootstrap")
        assert bootstrap.status_code == 200, bootstrap.text
        assert bootstrap.json()["profile"]["id"] == str(user_id)

        # A second, independent request (fresh session) must be able to
        # write against the profile the first request created.
        item_id = str(uuid4())
        response = client.put(
            f"/api/v1/foundation/essential-expenses/{item_id}",
            json={
                "id": item_id,
                "category": "food",
                "label": "Groceries",
                "amountCents": 5_000,
                "cadence": "weekly",
                "isActive": True,
            },
        )
        assert response.status_code == 200, response.text
