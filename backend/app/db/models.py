from datetime import date, datetime
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func

SCHEMA = "resilience"


class Base(DeclarativeBase):
    pass


class Profile(Base):
    __tablename__ = "profiles"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    currency: Mapped[str] = mapped_column(Text, default="SGD")
    timezone: Mapped[str] = mapped_column(Text, default="Asia/Singapore")
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    latest_emergency_savings_cents: Mapped[int] = mapped_column(BigInteger, default=0)
    display_name: Mapped[str | None] = mapped_column(Text)
    phone_number: Mapped[str | None] = mapped_column(Text)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RecurringWorkCost(Base):
    __tablename__ = "recurring_work_costs"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), index=True
    )
    category: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(Text)
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    cadence: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EssentialExpense(Base):
    __tablename__ = "essential_expenses"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), index=True
    )
    category: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(Text)
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    cadence: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WeeklyEntry(Base):
    __tablename__ = "weekly_entries"
    __table_args__ = (UniqueConstraint("user_id", "week_start"), {"schema": SCHEMA})

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), index=True
    )
    week_start: Mapped[date] = mapped_column(Date)
    had_no_income: Mapped[bool] = mapped_column(Boolean, default=False)
    emergency_savings_cents: Mapped[int] = mapped_column(BigInteger)
    status: Mapped[str] = mapped_column(Text, default="confirmed")
    revision: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    earnings: Mapped[list["WeeklyEarning"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="WeeklyEarning.created_at"
    )
    variable_costs: Mapped[list["WeeklyVariableCost"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="WeeklyVariableCost.created_at"
    )
    input_snapshots: Mapped[list["WeeklyInputSnapshot"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="WeeklyInputSnapshot.created_at"
    )


class WeeklyEarning(Base):
    __tablename__ = "weekly_earnings"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    weekly_entry_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.weekly_entries.id", ondelete="CASCADE"), index=True
    )
    platform_code: Mapped[str] = mapped_column(Text)
    platform_label: Mapped[str | None] = mapped_column(Text)
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WeeklyVariableCost(Base):
    __tablename__ = "weekly_variable_costs"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    weekly_entry_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.weekly_entries.id", ondelete="CASCADE"), index=True
    )
    category: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(Text)
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WeeklyInputSnapshot(Base):
    __tablename__ = "weekly_input_snapshots"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    weekly_entry_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.weekly_entries.id", ondelete="CASCADE"), index=True
    )
    source_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True))
    input_kind: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(Text)
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    cadence: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EmergencySavingsSnapshot(Base):
    __tablename__ = "emergency_savings_snapshots"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), index=True
    )
    source_weekly_entry_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(f"{SCHEMA}.weekly_entries.id", ondelete="CASCADE"), unique=True
    )
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class IdempotencyReceipt(Base):
    __tablename__ = "idempotency_receipts"
    __table_args__ = (UniqueConstraint("user_id", "idempotency_key"), {"schema": SCHEMA})

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), index=True
    )
    idempotency_key: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    request_hash: Mapped[str] = mapped_column(Text)
    response_status: Mapped[int] = mapped_column(Integer)
    response_body: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EmergencyFundPlan(Base):
    __tablename__ = "emergency_fund_plans"
    __table_args__ = {"schema": SCHEMA}

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), primary_key=True
    )
    recommendation_method: Mapped[str] = mapped_column(Text, default="conservative_4_week")
    target_frequency: Mapped[str] = mapped_column(Text, default="weekly")
    target_amount_cents: Mapped[int] = mapped_column(BigInteger, default=0)
    weekly_target_cents: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[str] = mapped_column(Text, default="active")
    goal_mode: Mapped[str] = mapped_column(Text, default="coverage")
    goal_amount_cents: Mapped[int | None] = mapped_column(BigInteger)
    goal_weeks: Mapped[int | None] = mapped_column(Integer)
    goal_expense_baseline_cents: Mapped[int | None] = mapped_column(BigInteger)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EmergencyFundContribution(Base):
    __tablename__ = "emergency_fund_contributions"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), index=True
    )
    entry_type: Mapped[str] = mapped_column(Text)
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    contribution_date: Mapped[date] = mapped_column(Date)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SavingsGoal(Base):
    """A named user savings goal. ``goal_type`` is always ``savings`` here."""

    __tablename__ = "goals"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), index=True
    )
    goal_type: Mapped[str] = mapped_column(Text, default="savings")
    name: Mapped[str] = mapped_column(Text)
    target_cents: Mapped[int] = mapped_column(BigInteger)
    target_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(Text, default="active")
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    contributions: Mapped[list["SavingsGoalContribution"]] = relationship(
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="SavingsGoalContribution.contributed_on.desc()",
    )


class SavingsGoalContribution(Base):
    __tablename__ = "goal_contributions"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    goal_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.goals.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), index=True
    )
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    contributed_on: Mapped[date] = mapped_column(Date)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(f"{SCHEMA}.profiles.id", ondelete="CASCADE"), index=True
    )
    entry_type: Mapped[str] = mapped_column(Text)
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    description: Mapped[str | None] = mapped_column(Text)
    occurred_on: Mapped[date] = mapped_column(Date)
    occurred_until: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
