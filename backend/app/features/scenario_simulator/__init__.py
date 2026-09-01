"""Scenario Simulator: estimated cash-flow and emergency-buffer impact of a shock.

The deterministic engine is importable without FastAPI, a database, or an LLM.
`router` is deliberately not re-exported here so that importing the engine does
not require the web framework to be installed.
"""

from .engine import project_weeks, simulate
from .guidance import DISCLAIMERS, OFFICIAL_RESOURCES
from .models import (
    BaselineFinances,
    BaselineSummary,
    OfficialResource,
    PreparatoryAction,
    ScenarioResult,
    ScenarioSummary,
    ShockScenario,
    WeekProjection,
)
from .serialization import result_to_dict

__all__ = [
    "BaselineFinances",
    "BaselineSummary",
    "DISCLAIMERS",
    "OFFICIAL_RESOURCES",
    "OfficialResource",
    "PreparatoryAction",
    "ScenarioResult",
    "ScenarioSummary",
    "ShockScenario",
    "WeekProjection",
    "project_weeks",
    "result_to_dict",
    "simulate",
]
