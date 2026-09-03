"""DB-backed integration test for GET /api/v1/financial-score."""

from __future__ import annotations

from datetime import timedelta

from .db_support import last_monday, singapore_today, throwaway_user


def test_financial_score_for_a_seeded_user() -> None:
    with throwaway_user() as (client, _user_id):
        today = singapore_today()

        # Ensures the profile row is created *and committed* before anything
        # else (bootstrap alone only flushes it within its own transaction).
        assert client.patch("/api/v1/foundation/profile", json={}).status_code == 200

        # Essential expense so the emergency-fund coverage target exists.
        essential = client.put(
            "/api/v1/foundation/essential-expenses/00000000-0000-0000-0000-000000000001",
            json={
                "id": "00000000-0000-0000-0000-000000000001",
                "category": "food",
                "label": "Groceries",
                "amountCents": 10_000,
                "cadence": "weekly",
                "isActive": True,
            },
        )
        assert essential.status_code == 200, essential.text

        # A deposit toward the emergency fund, recent enough to count toward
        # the savings-habit achievement window.
        deposit = client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 20_000, "contribution_date": today.isoformat(), "note": "seed"},
        )
        assert deposit.status_code == 201, deposit.text

        # An active weekly plan target.
        plan = client.patch(
            "/api/v1/resilience-jar/plan",
            json={"weekly_target_cents": 5_000},
        )
        assert plan.status_code == 200, plan.text

        # A few weeks of income/cost transactions for the cash-flow component.
        for weeks_ago in range(1, 4):
            week_day = last_monday(weeks_ago) + timedelta(days=1)
            income = client.post(
                "/api/v1/foundation/transactions",
                json={
                    "entryType": "income",
                    "amountCents": 100_000,
                    "occurredOn": week_day.isoformat(),
                },
            )
            assert income.status_code == 201, income.text
            cost = client.post(
                "/api/v1/foundation/transactions",
                json={
                    "entryType": "cost",
                    "amountCents": 60_000,
                    "occurredOn": week_day.isoformat(),
                },
            )
            assert cost.status_code == 201, cost.text

        response = client.get("/api/v1/financial-score")
        assert response.status_code == 200, response.text
        body = response.json()

        assert set(body.keys()) == {
            "score",
            "band",
            "generatedAt",
            "scoredMaxPoints",
            "components",
            "nextStep",
            "missingInputs",
        }
        assert body["band"] in {"building", "steady", "strong", "resilient", "unknown"}
        assert len(body["components"]) == 3
        ids = {c["id"] for c in body["components"]}
        assert ids == {"emergency_fund", "savings_habit", "cash_flow"}
        for component in body["components"]:
            assert component["status"] in {"scored", "not_enough_information"}
            assert 0 <= component["points"] <= component["maxPoints"]
            assert component["detail"]

        # With an essential expense, deposit, plan target, and cash-flow
        # history all seeded, everything should be scored, so nothing is
        # missing.
        assert all(c["status"] == "scored" for c in body["components"])
        assert body["score"] is not None
        assert 0 <= body["score"] <= 100
        assert body["missingInputs"] == []


def test_financial_score_withholds_score_and_explains_why_when_missing_inputs() -> None:
    """Reproduces the reported bug: the user entered an emergency-fund
    balance, a savings goal, and some transactions, but never recorded any
    essential expenses (so the coverage target can't be sized) and only
    logged cost transactions (so cash flow has no measurable income). The
    score comes back null, but missingInputs must tell the user exactly
    what's missing instead of leaving them guessing."""
    with throwaway_user() as (client, _user_id):
        today = singapore_today()

        assert client.patch("/api/v1/foundation/profile", json={}).status_code == 200

        # A deposit toward the emergency fund -- the user does have a balance.
        deposit = client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 20_000, "contribution_date": today.isoformat(), "note": "seed"},
        )
        assert deposit.status_code == 201, deposit.text

        # A savings goal, so the savings-habit plan half is satisfied.
        goal = client.post(
            "/api/v1/savings-goals",
            json={"name": "New laptop", "targetCents": 500_000},
        )
        assert goal.status_code == 201, goal.text

        # Cost-only transactions: no recorded income at all.
        for weeks_ago in range(1, 4):
            week_day = last_monday(weeks_ago) + timedelta(days=1)
            cost = client.post(
                "/api/v1/foundation/transactions",
                json={
                    "entryType": "cost",
                    "amountCents": 40_000,
                    "occurredOn": week_day.isoformat(),
                },
            )
            assert cost.status_code == 201, cost.text

        # No essential expenses are recorded at all, so the emergency-fund
        # coverage target cannot be sized.

        response = client.get("/api/v1/financial-score")
        assert response.status_code == 200, response.text
        body = response.json()

        assert body["score"] is None
        assert body["band"] == "unknown"

        ef = next(c for c in body["components"] if c["id"] == "emergency_fund")
        cf = next(c for c in body["components"] if c["id"] == "cash_flow")
        assert ef["status"] == "not_enough_information"
        assert cf["status"] == "not_enough_information"

        missing_ids = [item["id"] for item in body["missingInputs"]]
        assert "essential_expenses" in missing_ids
        assert "income_transactions" in missing_ids
        for item in body["missingInputs"]:
            assert set(item.keys()) == {"id", "label", "action", "route"}
