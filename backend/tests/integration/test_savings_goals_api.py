"""Savings Goals CRUD, contribution flow, and ownership isolation."""

from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

from backend.tests.integration.db_support import (
    requires_database,
    singapore_today,
    throwaway_user,
)

pytestmark = requires_database


def test_goal_crud_and_contribution_flow() -> None:
    with throwaway_user() as (client, _user_id):
        target_date = (singapore_today() + timedelta(days=28)).isoformat()
        created = client.post(
            "/api/v1/savings-goals",
            json={"name": "  New laptop  ", "targetCents": 100_000, "targetDate": target_date},
        )
        assert created.status_code == 201, created.text
        goal = created.json()
        assert goal["name"] == "New laptop"
        assert goal["savedCents"] == 0
        assert goal["remainingCents"] == 100_000
        assert goal["reached"] is False
        assert goal["suggestedWeeklyCents"] == 25_000
        assert goal["status"] == "active"
        assert goal["contributions"] == []

        listed = client.get("/api/v1/savings-goals")
        assert listed.status_code == 200
        assert [item["id"] for item in listed.json()["goals"]] == [goal["id"]]

        funded = client.post(
            f"/api/v1/savings-goals/{goal['id']}/contributions",
            json={
                "amountCents": 40_000,
                "contributedOn": singapore_today().isoformat(),
                "note": "  Bonus  ",
            },
        )
        assert funded.status_code == 201, funded.text
        assert funded.json()["savedCents"] == 40_000
        assert funded.json()["remainingCents"] == 60_000
        assert funded.json()["suggestedWeeklyCents"] == 15_000
        assert funded.json()["contributions"][0]["note"] == "Bonus"
        contribution_id = funded.json()["contributions"][0]["id"]

        topped_up = client.post(
            f"/api/v1/savings-goals/{goal['id']}/contributions",
            json={"amountCents": 60_000, "contributedOn": singapore_today().isoformat()},
        )
        assert topped_up.json()["reached"] is True
        assert topped_up.json()["remainingCents"] == 0
        assert topped_up.json()["suggestedWeeklyCents"] is None

        patched = client.patch(
            f"/api/v1/savings-goals/{goal['id']}",
            json={"status": "completed", "name": "Laptop"},
        )
        assert patched.status_code == 200, patched.text
        assert patched.json()["status"] == "completed"
        assert patched.json()["name"] == "Laptop"

        removed_contribution = client.delete(
            f"/api/v1/savings-goals/{goal['id']}/contributions/{contribution_id}"
        )
        assert removed_contribution.status_code == 204
        assert client.get("/api/v1/savings-goals").json()["goals"][0]["savedCents"] == 60_000

        removed = client.delete(f"/api/v1/savings-goals/{goal['id']}")
        assert removed.status_code == 204
        assert client.get("/api/v1/savings-goals").json()["goals"] == []


def test_goals_are_ordered_active_then_completed_then_archived() -> None:
    with throwaway_user() as (client, _user_id):
        names = ("first", "second", "third", "fourth")
        ids = {}
        for name in names:
            response = client.post(
                "/api/v1/savings-goals", json={"name": name, "targetCents": 1_000}
            )
            ids[name] = response.json()["id"]
        client.patch(f"/api/v1/savings-goals/{ids['first']}", json={"status": "archived"})
        client.patch(f"/api/v1/savings-goals/{ids['second']}", json={"status": "completed"})

        goals = client.get("/api/v1/savings-goals").json()["goals"]

        assert [item["name"] for item in goals] == ["fourth", "third", "second", "first"]


def test_savings_goals_never_touch_the_emergency_fund() -> None:
    with throwaway_user() as (client, _user_id):
        client.put("/api/v1/resilience-jar/opening-balance", json={"amount_cents": 100_000})
        goal = client.post(
            "/api/v1/savings-goals", json={"name": "Bike", "targetCents": 50_000}
        ).json()
        client.post(
            f"/api/v1/savings-goals/{goal['id']}/contributions",
            json={"amountCents": 25_000, "contributedOn": singapore_today().isoformat()},
        )

        profile = client.get("/api/v1/foundation/bootstrap").json()["profile"]
        summary = client.get("/api/v1/resilience-jar/summary").json()

        assert profile["emergencyFundBalanceCents"] == 100_000
        assert summary["progress"]["contribution_total_cents"] == 100_000


def test_another_user_cannot_read_patch_or_delete_a_goal() -> None:
    with throwaway_user() as (client, _user_id):
        goal = client.post(
            "/api/v1/savings-goals", json={"name": "Private", "targetCents": 10_000}
        ).json()
        contribution = client.post(
            f"/api/v1/savings-goals/{goal['id']}/contributions",
            json={"amountCents": 1_000, "contributedOn": singapore_today().isoformat()},
        ).json()["contributions"][0]

        with throwaway_user() as (other_client, _other_id):
            assert other_client.get("/api/v1/savings-goals").json()["goals"] == []
            patched = other_client.patch(
                f"/api/v1/savings-goals/{goal['id']}", json={"name": "Stolen"}
            )
            deleted = other_client.delete(f"/api/v1/savings-goals/{goal['id']}")
            funded = other_client.post(
                f"/api/v1/savings-goals/{goal['id']}/contributions",
                json={"amountCents": 1, "contributedOn": singapore_today().isoformat()},
            )
            unfunded = other_client.delete(
                f"/api/v1/savings-goals/{goal['id']}/contributions/{contribution['id']}"
            )

            for response in (patched, deleted, funded, unfunded):
                assert response.status_code == 404, response.text
                assert response.json()["error"]["code"] == "NOT_FOUND"

        assert client.get("/api/v1/savings-goals").json()["goals"][0]["name"] == "Private"


def test_unknown_goal_and_invalid_payloads_are_rejected() -> None:
    with throwaway_user() as (client, _user_id):
        missing = client.patch(f"/api/v1/savings-goals/{uuid4()}", json={"name": "x"})
        assert missing.status_code == 404
        assert missing.json()["error"]["code"] == "NOT_FOUND"

        goal = client.post(
            "/api/v1/savings-goals", json={"name": "Fund", "targetCents": 10_000}
        ).json()
        future = client.post(
            f"/api/v1/savings-goals/{goal['id']}/contributions",
            json={
                "amountCents": 100,
                "contributedOn": (singapore_today() + timedelta(days=1)).isoformat(),
            },
        )
        assert future.status_code == 422
        assert future.json()["error"]["fieldErrors"][0]["path"] == "contributedOn"

        assert (
            client.post("/api/v1/savings-goals", json={"name": "", "targetCents": 1}).status_code
            == 422
        )
        assert client.patch(f"/api/v1/savings-goals/{goal['id']}", json={}).status_code == 422
