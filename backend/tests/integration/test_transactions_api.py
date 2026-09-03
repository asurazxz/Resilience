"""Coverage for POST/PATCH /foundation/transactions, including occurredUntil."""

from __future__ import annotations

from datetime import date, timedelta

from .db_support import requires_database, throwaway_user

pytestmark = requires_database


def _create(client, amount_cents=10_000, occurred_on=None, occurred_until=None, entry_type="cost"):
    occurred_on = occurred_on or (date.today() - timedelta(days=5)).isoformat()
    payload = {
        "entryType": entry_type,
        "amountCents": amount_cents,
        "occurredOn": occurred_on,
    }
    if occurred_until is not None:
        payload["occurredUntil"] = occurred_until
    response = client.post("/api/v1/foundation/transactions", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_and_bootstrap_round_trip_occurred_until() -> None:
    with throwaway_user() as (client, _user_id):
        start = (date.today() - timedelta(days=10)).isoformat()
        end = (date.today() - timedelta(days=3)).isoformat()
        created = _create(client, occurred_on=start, occurred_until=end)
        assert created["occurredUntil"] == end

        bootstrap = client.get("/api/v1/foundation/bootstrap")
        assert bootstrap.status_code == 200
        found = next(t for t in bootstrap.json()["transactions"] if t["id"] == created["id"])
        assert found["occurredUntil"] == end


def test_update_transaction_happy_path_partial() -> None:
    with throwaway_user() as (client, _user_id):
        created = _create(client, amount_cents=5_000)
        patched = client.patch(
            f"/api/v1/foundation/transactions/{created['id']}",
            json={"amountCents": 7_500},
        )
        assert patched.status_code == 200, patched.text
        body = patched.json()
        assert body["amountCents"] == 7_500
        # Untouched fields keep their previous value.
        assert body["entryType"] == created["entryType"]
        assert body["occurredOn"] == created["occurredOn"]


def test_update_transaction_ownership_404() -> None:
    with throwaway_user() as (client_a, _user_a):
        created = _create(client_a)
    with throwaway_user() as (client_b, _user_b):
        response = client_b.patch(
            f"/api/v1/foundation/transactions/{created['id']}",
            json={"amountCents": 1_000},
        )
        assert response.status_code == 404


def test_update_transaction_clears_range_with_null() -> None:
    with throwaway_user() as (client, _user_id):
        start = (date.today() - timedelta(days=10)).isoformat()
        end = (date.today() - timedelta(days=3)).isoformat()
        created = _create(client, occurred_on=start, occurred_until=end)
        assert created["occurredUntil"] == end

        cleared = client.patch(
            f"/api/v1/foundation/transactions/{created['id']}",
            json={"occurredUntil": None},
        )
        assert cleared.status_code == 200, cleared.text
        assert cleared.json()["occurredUntil"] is None


def test_update_transaction_rejects_end_before_start() -> None:
    with throwaway_user() as (client, _user_id):
        start = (date.today() - timedelta(days=5)).isoformat()
        created = _create(client, occurred_on=start)
        earlier = (date.today() - timedelta(days=20)).isoformat()
        response = client.patch(
            f"/api/v1/foundation/transactions/{created['id']}",
            json={"occurredUntil": earlier},
        )
        assert response.status_code == 422, response.text


def test_update_transaction_rejects_future_end_date() -> None:
    with throwaway_user() as (client, _user_id):
        created = _create(client)
        future = (date.today() + timedelta(days=5)).isoformat()
        response = client.patch(
            f"/api/v1/foundation/transactions/{created['id']}",
            json={"occurredUntil": future},
        )
        assert response.status_code == 422, response.text


def test_update_transaction_full_body_still_works_as_replace() -> None:
    with throwaway_user() as (client, _user_id):
        created = _create(client, amount_cents=1_000, entry_type="cost")
        replacement = {
            "entryType": "income",
            "amountCents": 9_999,
            "description": "Replaced",
            "occurredOn": created["occurredOn"],
            "occurredUntil": None,
        }
        response = client.patch(
            f"/api/v1/foundation/transactions/{created['id']}", json=replacement
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["entryType"] == "income"
        assert body["amountCents"] == 9_999
        assert body["description"] == "Replaced"


def test_create_transaction_rejects_range_over_366_days() -> None:
    with throwaway_user() as (client, _user_id):
        start = (date.today() - timedelta(days=400)).isoformat()
        end = date.today().isoformat()
        response = client.post(
            "/api/v1/foundation/transactions",
            json={
                "entryType": "cost",
                "amountCents": 1_000,
                "occurredOn": start,
                "occurredUntil": end,
            },
        )
        assert response.status_code == 422, response.text
