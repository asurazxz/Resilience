"""Versioned scheme rules.

Each rule is a simplified, prototype-only approximation of a real Singapore
support scheme, built for demonstration and pre-screening rather than as a
legal or financial authority. Thresholds are approximate and must be
re-verified against the official source before any real user relies on a
result; ``simplified_note`` on every rule states this, and the API surfaces
it alongside every result.

Updating a threshold or adding a new scheme is a data change in this file,
not a change to the evaluator.
"""

from __future__ import annotations

from datetime import date

from .schemas import Condition, SchemeRule

RULES: list[SchemeRule] = [
    SchemeRule(
        id="workfare-income-supplement",
        name="Workfare Income Supplement (WIS)",
        agency="CPF Board",
        official_source_url="https://www.cpf.gov.sg/wis",
        application_url="https://www.cpf.gov.sg/wis",
        support_go_where_url="https://supportgowhere.life.gov.sg/schemes/E-WIS/workfare-income-supplement-wis-scheme",
        effective_date=date(2025, 1, 1),
        last_reviewed_date=date(2026, 9, 2),
        rule_version="1.0.0",
        summary=(
            "Cash and CPF supplement for lower-income Singaporean workers, "
            "including eligible platform workers."
        ),
        simplified_note=(
            "Simplified prototype approximation of the 2025 WIS parameters. "
            "Actual eligibility also depends on work-year averages and other "
            "factors assessed by CPF Board; confirm via the official source."
        ),
        conditions=[
            Condition(
                field="citizenship_status",
                operator="eq",
                value="singapore_citizen",
                description="Singapore Citizen",
            ),
            Condition(
                field="age",
                operator="gte",
                value=30,
                description="Aged 30 or above",
            ),
            Condition(
                field="monthly_income",
                operator="gt",
                value=500,
                description="Average gross monthly income above $500",
            ),
            Condition(
                field="monthly_income",
                operator="lte",
                value=3000,
                description="Average gross monthly income at or below $3,000",
            ),
            Condition(
                field="owns_more_than_one_property",
                operator="eq",
                value=False,
                description="Owns not more than one property",
            ),
            Condition(
                field="residence_annual_value",
                operator="lte",
                value=21000,
                description="Annual value of residence at or below $21,000",
            ),
            Condition(
                field="spouse_annual_income",
                operator="lte",
                value=70000,
                description="Spouse's assessable annual income at or below $70,000",
            ),
        ],
    ),
    SchemeRule(
        id="comcare-short-to-medium-term-assistance",
        name="ComCare Short-to-Medium Term Assistance",
        agency="Ministry of Social and Family Development",
        official_source_url="https://www.msf.gov.sg/comcare",
        application_url="https://www.msf.gov.sg/comcare",
        support_go_where_url="https://supportgowhere.life.gov.sg/schemes/COMCARE-SMTA/comcare-short-to-medium-term-assistance-smta",
        effective_date=date(2024, 1, 1),
        last_reviewed_date=date(2026, 9, 2),
        rule_version="1.0.0",
        summary=(
            "Financial assistance for lower-income individuals and families "
            "facing temporary hardship, covering living and other expenses."
        ),
        simplified_note=(
            "Simplified prototype approximation. Real ComCare assessment is "
            "means-tested holistically by a social worker; this is pre-screening "
            "only, not an assistance decision."
        ),
        conditions=[
            Condition(
                field="citizenship_status",
                operator="in",
                value=["singapore_citizen", "permanent_resident"],
                description="Singapore Citizen or Permanent Resident",
            ),
            Condition(
                field="household_income_per_capita",
                operator="lte",
                # Corrected 2026-09-02 from an earlier guess of $700 after
                # checking SupportGoWhere, which states $800 and below. The
                # old figure produced false negatives between $700 and $800
                # -- telling people they did not match when they may well
                # have qualified.
                value=800,
                description="Household income per member at or below $800/month",
            ),
            Condition(
                field="experiencing_financial_hardship",
                operator="eq",
                value=True,
                description="Currently experiencing financial hardship",
            ),
        ],
    ),
    SchemeRule(
        id="skillsfuture-credit",
        name="SkillsFuture Credit",
        agency="SkillsFuture Singapore",
        official_source_url="https://www.skillsfuture.gov.sg/credit",
        application_url="https://www.myskillsfuture.gov.sg",
        support_go_where_url="https://supportgowhere.life.gov.sg/schemes/SKILLSFUTURE_CREDITS/skillsfuture-credit",
        effective_date=date(2020, 1, 1),
        last_reviewed_date=date(2026, 9, 2),
        rule_version="1.0.0",
        summary="Credit for approved skills-related training courses.",
        simplified_note=(
            "Simplified prototype approximation of base eligibility. Additional "
            "age-based top-ups are not modelled in this prototype."
        ),
        conditions=[
            Condition(
                field="citizenship_status",
                operator="eq",
                value="singapore_citizen",
                description="Singapore Citizen",
            ),
            Condition(
                field="age",
                operator="gte",
                value=25,
                description="Aged 25 or above",
            ),
        ],
    ),
    SchemeRule(
        id="cdc-vouchers",
        name="Community Development Council (CDC) Vouchers",
        agency="GovTech / CDC (via SupportGoWhere)",
        official_source_url="https://supportgowhere.life.gov.sg",
        application_url="https://supportgowhere.life.gov.sg",
        support_go_where_url="https://supportgowhere.life.gov.sg/schemes/CDC/community-development-council-cdc-vouchers",
        effective_date=date(2024, 1, 1),
        last_reviewed_date=date(2026, 9, 2),
        rule_version="1.0.0",
        summary=(
            "Vouchers for Singapore Citizen households usable at participating "
            "hawkers and heartland merchants."
        ),
        simplified_note=(
            "Simplified prototype approximation. The base tranche has no income "
            "test in the actual scheme; this prototype models only the base "
            "household-citizenship condition."
        ),
        conditions=[
            Condition(
                field="citizenship_status",
                operator="eq",
                value="singapore_citizen",
                description="Household includes a Singapore Citizen",
            ),
        ],
    ),
]
