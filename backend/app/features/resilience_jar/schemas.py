"""Request models for the Emergency Fund (resilience jar) endpoints.

Only requests are modelled here. Responses stay hand-serialised in
``serializers.py`` because the frontend depends on their exact snake_case
shape.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .models import PlanStatus, RecommendationMethod, TargetFrequency


class _StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AmountGoalInput(_StrictModel):
    mode: Literal["amount"]
    amount_cents: int = Field(gt=0)


class CoverageGoalInput(_StrictModel):
    mode: Literal["coverage"]
    weeks: int = Field(ge=1, le=52)


GoalInput = Annotated[AmountGoalInput | CoverageGoalInput, Field(discriminator="mode")]


def _normalised_note(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip() or None


class PlanPatch(_StrictModel):
    recommendation_method: RecommendationMethod | None = None
    target_frequency: TargetFrequency | None = None
    target_amount_cents: int | None = Field(default=None, ge=0)
    weekly_target_cents: int | None = Field(default=None, ge=0)
    status: PlanStatus | None = None
    goal: GoalInput | None = None

    @model_validator(mode="after")
    def _at_least_one_field(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("Provide at least one plan field to update.")
        return self


class OpeningBalanceRequest(_StrictModel):
    amount_cents: int = Field(ge=0)


class ContributionWrite(_StrictModel):
    amount_cents: int = Field(gt=0)
    contribution_date: date
    note: str | None = Field(default=None, max_length=200)

    @field_validator("note")
    @classmethod
    def _strip_note(cls, value: str | None) -> str | None:
        return _normalised_note(value)


class ContributionPatch(_StrictModel):
    amount_cents: int | None = Field(default=None, gt=0)
    contribution_date: date | None = None
    note: str | None = Field(default=None, max_length=200)

    @field_validator("note")
    @classmethod
    def _strip_note(cls, value: str | None) -> str | None:
        return _normalised_note(value)

    @model_validator(mode="after")
    def _at_least_one_field(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("Provide at least one contribution field to update.")
        return self
