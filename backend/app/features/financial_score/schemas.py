"""Response models for the Financial Score. Camelcase via the shared ApiModel."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from backend.app.features.foundation_input.schemas import ApiModel

ComponentId = Literal["emergency_fund", "savings_habit", "cash_flow"]
ComponentStatus = Literal["scored", "not_enough_information"]
Band = Literal["building", "steady", "strong", "resilient", "unknown"]


MissingInputId = Literal[
    "essential_expenses", "emergency_fund_goal", "income_transactions", "savings_plan"
]


class FinancialScoreComponent(ApiModel):
    id: ComponentId
    label: str
    status: ComponentStatus
    points: int
    max_points: int
    detail: str


class FinancialScoreMissingInput(ApiModel):
    id: MissingInputId
    label: str
    action: str
    route: str


class FinancialScoreResponse(ApiModel):
    score: int | None
    band: Band
    generated_at: datetime
    scored_max_points: int
    components: list[FinancialScoreComponent]
    next_step: str | None
    missing_inputs: list[FinancialScoreMissingInput]
