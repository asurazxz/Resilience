from __future__ import annotations

import importlib.util
import unittest


@unittest.skipUnless(
    importlib.util.find_spec("fastapi"),
    "FastAPI is supplied by the Workstream 1 application scaffold.",
)
class ResilienceJarRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        from fastapi import FastAPI
        from fastapi.exceptions import RequestValidationError
        from fastapi.testclient import TestClient

        from backend.app.core.errors import DomainError
        from backend.app.features.resilience_jar.fixtures import (
            DEMO_USER_ID,
            build_demo_service,
        )
        from backend.app.features.resilience_jar.routes import create_router
        from backend.app.main import (
            API_PREFIX,
            domain_error_handler,
            validation_error_handler,
        )

        app = FastAPI()
        app.include_router(
            create_router(build_demo_service(), user_id_provider=lambda: DEMO_USER_ID),
            prefix=API_PREFIX,
        )
        app.add_exception_handler(DomainError, domain_error_handler)
        app.add_exception_handler(RequestValidationError, validation_error_handler)
        self.client = TestClient(app)

    def test_summary_and_plan_patch(self) -> None:
        initial = self.client.get("/api/v1/resilience-jar/summary")
        updated = self.client.patch(
            "/api/v1/resilience-jar/plan",
            json={"recommendation_method": "latest_week"},
        )

        self.assertEqual(200, initial.status_code)
        self.assertEqual(200, updated.status_code)
        self.assertEqual("latest_week", updated.json()["recommendation"]["method"])

    def test_unknown_plan_field_is_a_validation_error(self) -> None:
        response = self.client.patch("/api/v1/resilience-jar/plan", json={"nope": 1})

        self.assertEqual(422, response.status_code)
        self.assertEqual("VALIDATION_ERROR", response.json()["error"]["code"])
        self.assertTrue(response.json()["error"]["fieldErrors"])

    def test_invalid_contribution_uses_the_shared_error_envelope(self) -> None:
        invalid_amount = self.client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 0, "contribution_date": "2026-09-01"},
        )
        future_date = self.client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 2_500, "contribution_date": "2999-01-01"},
        )

        self.assertEqual(422, invalid_amount.status_code)
        self.assertEqual("VALIDATION_ERROR", invalid_amount.json()["error"]["code"])
        self.assertEqual(422, future_date.status_code)
        error = future_date.json()["error"]
        self.assertEqual("validation_error", error["code"])
        self.assertEqual(
            [{"path": "contribution_date", "message": error["fieldErrors"][0]["message"]}],
            error["fieldErrors"],
        )

    def test_contribution_crud(self) -> None:
        created = self.client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 2_500, "contribution_date": "2026-09-01"},
        )
        contribution_id = created.json()["id"]
        withdrawal = self.client.post(
            "/api/v1/resilience-jar/withdrawals",
            json={"amount_cents": 500, "contribution_date": "2026-09-01"},
        )
        edited = self.client.patch(
            f"/api/v1/resilience-jar/contributions/{contribution_id}",
            json={"amount_cents": 3_000},
        )
        deleted = self.client.delete(f"/api/v1/resilience-jar/contributions/{contribution_id}")

        self.assertEqual(201, created.status_code)
        self.assertEqual(201, withdrawal.status_code)
        self.assertEqual("withdrawal", withdrawal.json()["entry_type"])
        self.assertEqual(3_000, edited.json()["amount_cents"])
        self.assertEqual(204, deleted.status_code)

    def test_non_uuid_contribution_id_is_rejected_by_the_path_type(self) -> None:
        response = self.client.delete("/api/v1/resilience-jar/contributions/not-a-uuid")

        self.assertEqual(422, response.status_code)
        self.assertEqual("VALIDATION_ERROR", response.json()["error"]["code"])

    def test_unknown_contribution_is_not_found(self) -> None:
        response = self.client.patch(
            "/api/v1/resilience-jar/contributions/00000000-0000-4000-8000-000000000009",
            json={"amount_cents": 100},
        )

        self.assertEqual(404, response.status_code)
        self.assertEqual("contribution_not_found", response.json()["error"]["code"])

    def test_withdrawal_beyond_balance_is_rejected(self) -> None:
        response = self.client.post(
            "/api/v1/resilience-jar/withdrawals",
            json={"amount_cents": 99_999_999, "contribution_date": "2026-09-01"},
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("insufficient_jar_balance", response.json()["error"]["code"])


if __name__ == "__main__":
    unittest.main()
