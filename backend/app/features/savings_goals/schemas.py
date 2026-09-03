"""Request and response models for Savings Goals.

Responses use the shared ``ApiModel`` camelCase aliases, matching Foundation
Input. See ``documentation/features/savings-goals.md``.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Literal, Self
from uuid import UUID

from pydantic import Field, model_validator

from backend.app.features.foundation_input.schemas import ApiModel

GoalStatus = Literal["active", "completed", "archived"]

GoalName = Annotated[str, Field(min_length=1, max_length=80)]
TargetCents = Annotated[int, Field(gt=0, le=100_000_000)]
ContributionCents = Annotated[int, Field(gt=0, le=100_000_000)]
Note = Annotated[str | None, Field(default=None, max_length=200)]


class SavingsGoalCreate(ApiModel):
    name: GoalName
    target_cents: TargetCents
    target_date: date | None = None

    @model_validator(mode="after")
    def _trim_name(self) -> Self:
        if not self.name.strip():
            raise ValueError("name must not be blank")
        self.name = self.name.strip()
        return self


class SavingsGoalPatch(ApiModel):
    name: GoalName | None = None
    target_cents: TargetCents | None = None
    target_date: date | None = None
    status: GoalStatus | None = None

    @model_validator(mode="after")
    def _at_least_one_field(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("Provide at least one goal field to update.")
        if self.name is not None:
            if not self.name.strip():
                raise ValueError("name must not be blank")
            self.name = self.name.strip()
        return self


class SavingsGoalContributionCreate(ApiModel):
    amount_cents: ContributionCents
    contributed_on: date
    note: Note = None

    @model_validator(mode="after")
    def _normalise_note(self) -> Self:
        if self.note is not None:
            self.note = self.note.strip() or None
        return self


class SavingsGoalContributionResponse(ApiModel):
    id: UUID
    amount_cents: int
    contributed_on: date
    note: str | None
    created_at: datetime


class SavingsGoalResponse(ApiModel):
    id: UUID
    name: str
    target_cents: int
    target_date: date | None
    status: GoalStatus
    saved_cents: int
    remaining_cents: int
    reached: bool
    suggested_weekly_cents: int | None
    contributions: list[SavingsGoalContributionResponse]
    created_at: datetime
    updated_at: datetime


class SavingsGoalListResponse(ApiModel):
    goals: list[SavingsGoalResponse]
