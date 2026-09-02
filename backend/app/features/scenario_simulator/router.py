"""FastAPI routes for the Scenario Simulator.

Workstream 1 mounts this router on the application; nothing here holds state or
performs calculations of its own.
"""

from fastapi import APIRouter, HTTPException

from .engine import simulate
from .models import BaselineFinances, ShockScenario
from .schemas import ScenarioResultResponse, SimulationRequest
from .serialization import result_to_dict

router = APIRouter(prefix="/scenario-simulator", tags=["scenario-simulator"])


@router.post(
    "/simulate",
    response_model=ScenarioResultResponse,
    summary="Estimate cash flow and emergency-buffer runway for one financial shock",
)
def simulate_scenario(request: SimulationRequest) -> ScenarioResultResponse:
    try:
        baseline = BaselineFinances(**request.baseline.model_dump())
        scenario = ShockScenario(**request.scenario.model_dump())
    except ValueError as error:
        # The engine enforces the same bounds as the payload schema; this
        # catches any rule the transport layer does not express.
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "scenario_invalid_input",
                    "message": str(error),
                }
            },
        ) from error

    return ScenarioResultResponse.model_validate(result_to_dict(simulate(baseline, scenario)))
