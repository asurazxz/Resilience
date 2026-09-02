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
        from fastapi.testclient import TestClient

        from backend.app.features.resilience_jar.fixtures import (
            DEMO_USER_ID,
            build_demo_service,
        )
        from backend.app.features.resilience_jar.routes import create_router

        app = FastAPI()
        app.include_router(
            create_router(
                build_demo_service(), user_id_provider=lambda: DEMO_USER_ID
            )
        )
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

    def test_contribution_crud_and_validation_error_shape(self) -> None:
        invalid = self.client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 0, "contribution_date": "2999-01-01"},
        )
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
        deleted = self.client.delete(
            f"/api/v1/resilience-jar/contributions/{contribution_id}"
        )

        self.assertEqual(
            {"code", "message", "field_errors"}, set(invalid.json())
        )
        self.assertEqual(201, created.status_code)
        self.assertEqual(201, withdrawal.status_code)
        self.assertEqual("withdrawal", withdrawal.json()["entry_type"])
        self.assertEqual(3_000, edited.json()["amount_cents"])
        self.assertEqual(204, deleted.status_code)


if __name__ == "__main__":
    unittest.main()
