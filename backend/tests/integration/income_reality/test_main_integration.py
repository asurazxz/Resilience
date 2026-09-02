from backend.app.main import app
from fastapi.testclient import TestClient


def test_income_reality_router_is_mounted_in_shared_app() -> None:
    response = TestClient(app).post(
        "/api/v1/income-reality/breakdown",
        json={
            "weeks": [
                {
                    "week_start": "2026-08-24",
                    "platform_earnings": [{"platform": "Grab", "gross_cents": 50000}],
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.json()["weeks"][0]["net_income_cents"] == 50000
