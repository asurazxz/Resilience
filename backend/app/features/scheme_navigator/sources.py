"""Curated source material used to ground the AI features.

These snippets are the only scheme material the explainer and the chatbot
are given. Each one is a short factual statement taken from the scheme's
page on SupportGoWhere -- the government's own aggregator -- recorded with
that page's URL and the "scheme last updated" date it displayed when read.

They are summaries written for grounding, not quotations, and they are a
snapshot: schemes change. ``retrieved_on`` is what tells a future reader
how stale this is. Re-read the pages and update both the snippets and the
matching thresholds in ``rules.py`` when revisiting.

Adding a scheme means adding its rule in ``rules.py`` and its snippets
here, keyed by the same ``rule_id``. A rule with no snippets still works:
the AI features fall back to deterministic text.
"""

from __future__ import annotations

from datetime import date

from .schemas import SourceSnippet

# Where to send someone when this app cannot answer them. A dead end is
# never an acceptable response for a person looking for financial support,
# so every fallback path routes to one of these rather than reporting a
# technical fault.
#
# Unlike the scheme thresholds, these were checked against MSF's own pages
# (see COMCARE_HOTLINE_SOURCE) on the date recorded. Re-confirm
# periodically: a wrong number given to someone in financial distress is
# worse than no number at all.
SUPPORT_GO_WHERE_URL = "https://supportgowhere.life.gov.sg"
COMCARE_HOTLINE = "1800-222-0000"  # ComCare Call, MSF
COMCARE_HOTLINE_SOURCE = "https://www.msf.gov.sg/what-we-do/comcare"
CONTACTS_VERIFIED_ON = date(2026, 9, 2)

_WIS_URL = "https://supportgowhere.life.gov.sg/schemes/E-WIS/workfare-income-supplement-wis-scheme"
_COMCARE_URL = (
    "https://supportgowhere.life.gov.sg/schemes/COMCARE-SMTA/"
    "comcare-short-to-medium-term-assistance-smta"
)
_SKILLSFUTURE_URL = (
    "https://supportgowhere.life.gov.sg/schemes/SKILLSFUTURE_CREDITS/skillsfuture-credit"
)
_CDC_URL = (
    "https://supportgowhere.life.gov.sg/schemes/CDC/community-development-council-cdc-vouchers"
)

CURATED_SOURCES: dict[str, list[SourceSnippet]] = {
    # SupportGoWhere page stated "Scheme last updated 27 Apr 2026".
    "workfare-income-supplement": [
        SourceSnippet(
            text=(
                "Workfare Income Supplement supplements eligible workers' "
                "income and CPF savings through cash and CPF payments. "
                "Employees can receive up to $4,900 a year; self-employed "
                "persons and platform workers up to $3,267 a year."
            ),
            source_url=_WIS_URL,
            retrieved_on=date(2026, 9, 2),
        ),
        SourceSnippet(
            text=(
                "Eligibility covers Singapore Citizens aged 30 and above who "
                "are employees, self-employed persons or platform workers, "
                "with gross monthly income of $500 to $3,000 for the month "
                "worked, average gross monthly income not above $3,000 over "
                "the past 12 months, residence annual value not above "
                "$21,000, and not owning more than one property. If married, "
                "the spouse's assessable income must not exceed $70,000."
            ),
            source_url=_WIS_URL,
            retrieved_on=date(2026, 9, 2),
        ),
        SourceSnippet(
            text=(
                "Platform workers do not need to apply. Eligibility is "
                "assessed automatically from the net earnings declared by "
                "their platform operators for work done that month."
            ),
            source_url=_WIS_URL,
            retrieved_on=date(2026, 9, 2),
        ),
    ],
    # SupportGoWhere page stated "Scheme last updated 21 Aug 2026".
    "comcare-short-to-medium-term-assistance": [
        SourceSnippet(
            text=(
                "ComCare Short-to-Medium-Term Assistance gives temporary "
                "financial help to lower-income individuals or families who "
                "are temporarily unable to work, looking for a job, or "
                "earning a low income. It can include monthly cash for "
                "living expenses, help with rental, utilities and service "
                "and conservancy charges, medical assistance at public "
                "healthcare institutions, and employment assistance."
            ),
            source_url=_COMCARE_URL,
            retrieved_on=date(2026, 9, 2),
        ),
        SourceSnippet(
            text=(
                "It is for Singapore Citizens or Permanent Residents, with "
                "at least one household member being a Singapore Citizen, in "
                "households with monthly household income per person of $800 "
                "or below, who have little or no family support, savings or "
                "assets to rely on."
            ),
            source_url=_COMCARE_URL,
            retrieved_on=date(2026, 9, 2),
        ),
        SourceSnippet(
            text=(
                "Even if income exceeds these guidelines, a person facing "
                "financial difficulty can still approach a Social Service "
                "Office, which assesses each household's needs holistically. "
                "Applications can be made online through SupportGoWhere or "
                "in person at the nearest Social Service Office."
            ),
            source_url=_COMCARE_URL,
            retrieved_on=date(2026, 9, 2),
        ),
    ],
    # SupportGoWhere page stated "Scheme last updated 12 Aug 2026".
    "skillsfuture-credit": [
        SourceSnippet(
            text=(
                "SkillsFuture Credit lets Singapore Citizens aged 25 and "
                "above pay for or offset out-of-pocket course fees for "
                "approved courses. There is an opening credit of $500, which "
                "does not expire, and it can be used on top of existing "
                "course fee subsidies."
            ),
            source_url=_SKILLSFUTURE_URL,
            retrieved_on=date(2026, 9, 2),
        ),
        SourceSnippet(
            text=(
                "No application is required. Tell the training provider you "
                "intend to use the credit when registering, then submit the "
                "claim through MySkillsFuture within 60 days before the "
                "course start date. SkillsFuture's hotline is 6669 7932."
            ),
            source_url=_SKILLSFUTURE_URL,
            retrieved_on=date(2026, 9, 2),
        ),
    ],
    # SupportGoWhere page stated "Scheme last updated 01 Sep 2026".
    "cdc-vouchers": [
        SourceSnippet(
            text=(
                "CDC Vouchers can be spent at participating heartland "
                "merchants, hawkers and supermarkets, and are for households "
                "with at least one Singapore Citizen."
            ),
            source_url=_CDC_URL,
            retrieved_on=date(2026, 9, 2),
        ),
        SourceSnippet(
            text=(
                "Each Singaporean household can claim $500 in CDC Vouchers "
                "from June 2026 and a further $300 from January 2027, valid "
                "until 31 December 2027. No application is needed; "
                "households claim through the RedeemSG website. The People's "
                "Association contact centre is 6225 5322."
            ),
            source_url=_CDC_URL,
            retrieved_on=date(2026, 9, 2),
        ),
    ],
}


def snippets_for(rule_id: str) -> list[SourceSnippet]:
    return CURATED_SOURCES.get(rule_id, [])
