from datetime import date, datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

MoneyCents = Annotated[int, Field(ge=0, le=100_000_000)]
PositiveMoneyCents = Annotated[int, Field(gt=0, le=100_000_000)]
Cadence = Literal["weekly", "monthly"]
WorkCostCategory = Literal["vehicle_rental", "insurance", "subscription", "equipment", "other"]
EssentialCategory = Literal[
    "housing", "food", "transport", "utilities", "healthcare", "caregiving", "debt", "other"
]
VariableCostCategory = Literal[
    "fuel", "charging", "tolls", "parking", "repairs", "platform_fees", "cpf", "other"
]
PlatformCode = Literal["grab", "gojek", "tada", "deliveroo", "foodpanda", "lalamove", "other"]


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class ProfileResponse(ApiModel):
    id: UUID
    currency: str
    timezone: str
    onboarding_completed: bool
    latest_emergency_savings_cents: MoneyCents


class ProfileUpdate(ApiModel):
    latest_emergency_savings_cents: MoneyCents


class RecurringWorkCostInput(ApiModel):
    id: UUID
    category: WorkCostCategory
    label: Annotated[str, Field(min_length=1, max_length=80)]
    amount_cents: PositiveMoneyCents
    cadence: Cadence
    is_active: bool = True


class RecurringWorkCostResponse(RecurringWorkCostInput):
    created_at: datetime
    updated_at: datetime


class EssentialExpenseInput(ApiModel):
    id: UUID
    category: EssentialCategory
    label: Annotated[str, Field(min_length=1, max_length=80)]
    amount_cents: PositiveMoneyCents
    cadence: Cadence
    is_active: bool = True


class EssentialExpenseResponse(EssentialExpenseInput):
    created_at: datetime
    updated_at: datetime


class EarningInput(ApiModel):
    id: UUID
    platform_code: PlatformCode
    platform_label: Annotated[str | None, Field(default=None, min_length=1, max_length=80)]
    amount_cents: MoneyCents

    @model_validator(mode="after")
    def require_other_label(self) -> "EarningInput":
        if self.platform_code == "other" and not self.platform_label:
            raise ValueError("platformLabel is required when platformCode is other")
        return self


class VariableCostInput(ApiModel):
    id: UUID
    category: VariableCostCategory
    label: Annotated[str, Field(min_length=1, max_length=80)]
    amount_cents: MoneyCents


class InputSnapshot(ApiModel):
    id: UUID
    source_id: UUID | None = None
    input_kind: Literal["recurring_work_cost", "essential_expense"]
    category: Annotated[str, Field(min_length=1, max_length=40)]
    label: Annotated[str, Field(min_length=1, max_length=80)]
    amount_cents: PositiveMoneyCents
    cadence: Cadence


class WeeklyEntryUpsert(ApiModel):
    id: UUID
    expected_revision: Annotated[int | None, Field(default=None, ge=1)]
    had_no_income: bool = False
    emergency_savings_cents: MoneyCents
    status: Literal["draft", "confirmed"] = "confirmed"
    earnings: list[EarningInput] = Field(default_factory=list, max_length=20)
    variable_costs: list[VariableCostInput] = Field(default_factory=list, max_length=50)
    input_snapshots: list[InputSnapshot] = Field(default_factory=list, max_length=50)

    @model_validator(mode="after")
    def validate_income_state(self) -> "WeeklyEntryUpsert":
        if self.had_no_income and self.earnings:
            raise ValueError("earnings must be empty when hadNoIncome is true")
        if not self.had_no_income and not self.earnings:
            raise ValueError("add at least one earning or mark the week as no income")
        return self


class WeeklyEntryResponse(ApiModel):
    id: UUID
    week_start: date
    had_no_income: bool
    emergency_savings_cents: MoneyCents
    status: Literal["draft", "confirmed"]
    revision: int
    earnings: list[EarningInput]
    variable_costs: list[VariableCostInput]
    input_snapshots: list[InputSnapshot]
    created_at: datetime
    updated_at: datetime


class OnboardingRequest(ApiModel):
    emergency_savings_cents: MoneyCents
    recurring_work_costs: list[RecurringWorkCostInput] = Field(default_factory=list, max_length=30)
    essential_expenses: list[EssentialExpenseInput] = Field(default_factory=list, max_length=30)
    first_week_start: date | None = None
    first_week: WeeklyEntryUpsert | None = None

    @model_validator(mode="after")
    def validate_first_week(self) -> "OnboardingRequest":
        if (self.first_week_start is None) != (self.first_week is None):
            raise ValueError("firstWeekStart and firstWeek must be supplied together")
        return self


class FoundationBootstrap(ApiModel):
    profile: ProfileResponse
    recurring_work_costs: list[RecurringWorkCostResponse]
    essential_expenses: list[EssentialExpenseResponse]
    weekly_entries: list[WeeklyEntryResponse]
    synced_at: datetime


class CsvPreviewRow(ApiModel):
    row_number: int
    status: Literal["valid", "invalid"]
    week_start: date | None = None
    record_type: Literal["earning", "variable_work_cost"] | None = None
    source: str | None = None
    category: str | None = None
    description: str | None = None
    amount_cents: MoneyCents | None = None
    errors: list[str] = Field(default_factory=list)


class CsvPreviewResponse(ApiModel):
    file_name: str
    file_sha256: str
    rows: list[CsvPreviewRow]
    valid_count: int
    invalid_count: int
