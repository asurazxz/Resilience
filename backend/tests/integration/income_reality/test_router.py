"""Integration test for the Income Reality router, crossing the FastAPI
request/response boundary via TestClient.

Builds a throwaway FastAPI app and mounts the router at the documented
prefix (see router.py's module docstring) - feature/01-foundation-input's
real app/main.py does not exist yet, so this test stands in for it. Reuses
the same contracts/fixtures/income-reality/ examples as
tests/unit/income_reality/test_fixtures.py so both the engine layer and the
HTTP/schema layer are checked against one shared set of worked examples.
"""

import json
from pathlib import Path
from uuid import UUID

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.core.auth import current_user_id
from backend.app.features.income_reality.router import router

FIXTURES_DIR = Path(__file__).resolve().parents[4] / "contracts" / "fixtures" / "income-reality"
SCENARIOS = ["typical-week", "zero-income-week", "multi-week-deficit"]

app = FastAPI()
app.include_router(router, prefix="/income-reality", tags=["income-reality"])
app.dependency_overrides[current_user_id] = lambda: UUID("00000000-0000-4000-8000-000000000001")
client = TestClient(app)


def _load(name: str) -> dict:
    return json.loads((FIXTURES_DIR / name).read_text())


def test_breakdown_endpoint_matches_every_fixture_response():
    for scenario in SCENARIOS:
        request = _load(f"{scenario}-request.json")
        expected_response = _load(f"{scenario}-response.json")

        response = client.post("/income-reality/breakdown", json=request)

        assert response.status_code == 200, scenario
        assert response.json() == expected_response, scenario


def test_breakdown_endpoint_rejects_empty_weeks_list():
    response = client.post("/income-reality/breakdown", json={"weeks": []})
    assert response.status_code == 422


def test_breakdown_endpoint_rejects_negative_gross_cents():
    response = client.post(
        "/income-reality/breakdown",
        json={
            "weeks": [
                {
                    "week_start": "2026-08-24",
                    "platform_earnings": [{"platform": "Grab", "gross_cents": -100}],
                }
            ]
        },
    )
    assert response.status_code == 422


def test_breakdown_endpoint_defaults_assumptions_when_omitted():
    response = client.post(
        "/income-reality/breakdown",
        json={
            "weeks": [
                {
                    "week_start": "2026-08-24",
                    "platform_earnings": [{"platform": "Grab", "gross_cents": 10000}],
                }
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["assumptions_applied"] == {"apply_cpf": False, "cpf_rate_bps": 800}
    assert body["weeks"][0]["cpf_cents"] == 0


def test_breakdown_endpoint_prefers_recorded_cpf_over_estimate():
    response = client.post(
        "/income-reality/breakdown",
        json={
            "weeks": [
                {
                    "week_start": "2026-08-24",
                    "platform_earnings": [{"platform": "Grab", "gross_cents": 100000}],
                    "work_costs_cents": 12000,
                    "recorded_cpf_cents": 5000,
                }
            ],
            "assumptions": {"apply_cpf": True, "cpf_rate_bps": 800},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["weeks"][0]["cpf_cents"] == 5000
    assert body["weeks"][0]["net_income_cents"] == 83000
