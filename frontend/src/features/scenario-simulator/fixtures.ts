/**
 * Offline preview data for the Scenario Simulator.
 *
 * Generated from contracts/fixtures/scenario-simulator.fixtures.json, which is
 * produced by the deterministic engine. Synthetic figures only. This is used
 * when the API is unreachable so the screen still renders, and the UI labels
 * it as preview data rather than the user's own numbers.
 */

import type { BaselineFinancesPayload, ScenarioResult, ShockScenarioPayload } from './types';

export const PREVIEW_BASELINE: BaselineFinancesPayload = {
  "weekly_gross_earnings_cents": 90000,
  "weekly_variable_work_costs_cents": 15000,
  "weekly_fixed_work_costs_cents": 25000,
  "weekly_essential_expenses_cents": 40000,
  "emergency_savings_cents": 120000
};

export const PREVIEW_SCENARIO: ShockScenarioPayload = {
  "income_reduction_percent": 50,
  "weeks_affected": 4,
  "recovery_weeks": 3,
  "unexpected_cost_cents": 0
};

export const PREVIEW_RESULT: ScenarioResult = {
  "baseline": {
    "weekly_gross_earnings_cents": 90000,
    "weekly_work_costs_cents": 40000,
    "weekly_net_work_income_cents": 50000,
    "weekly_essential_expenses_cents": 40000,
    "weekly_surplus_cents": 10000,
    "emergency_savings_cents": 120000,
    "emergency_savings_weeks_of_essentials": 3,
    "runway_weeks": null
  },
  "scenario": {
    "horizon_weeks": 11,
    "weeks_affected": 4,
    "recovery_weeks": 3,
    "weekly_net_work_income_during_shock_cents": 12500,
    "weekly_net_cash_flow_during_shock_cents": -27500,
    "unexpected_cost_cents": 0,
    "total_income_lost_cents": 206250,
    "lowest_buffer_cents": 0,
    "lowest_buffer_week": 5,
    "buffer_runway_weeks": 4,
    "first_shortfall_week": 5,
    "total_shortfall_cents": 16875,
    "buffer_at_horizon_cents": 40625,
    "buffer_holds_through_horizon": false,
    "full_income_resumes_week": 8
  },
  "weeks": [
    {
      "week": 1,
      "gross_earnings_cents": 45000,
      "work_costs_cents": 32500,
      "net_work_income_cents": 12500,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": -27500,
      "buffer_open_cents": 120000,
      "buffer_close_cents": 92500,
      "shortfall_cents": 0
    },
    {
      "week": 2,
      "gross_earnings_cents": 45000,
      "work_costs_cents": 32500,
      "net_work_income_cents": 12500,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": -27500,
      "buffer_open_cents": 92500,
      "buffer_close_cents": 65000,
      "shortfall_cents": 0
    },
    {
      "week": 3,
      "gross_earnings_cents": 45000,
      "work_costs_cents": 32500,
      "net_work_income_cents": 12500,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": -27500,
      "buffer_open_cents": 65000,
      "buffer_close_cents": 37500,
      "shortfall_cents": 0
    },
    {
      "week": 4,
      "gross_earnings_cents": 45000,
      "work_costs_cents": 32500,
      "net_work_income_cents": 12500,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": -27500,
      "buffer_open_cents": 37500,
      "buffer_close_cents": 10000,
      "shortfall_cents": 0
    },
    {
      "week": 5,
      "gross_earnings_cents": 56250,
      "work_costs_cents": 34375,
      "net_work_income_cents": 21875,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": -18125,
      "buffer_open_cents": 10000,
      "buffer_close_cents": 0,
      "shortfall_cents": 8125
    },
    {
      "week": 6,
      "gross_earnings_cents": 67500,
      "work_costs_cents": 36250,
      "net_work_income_cents": 31250,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": -8750,
      "buffer_open_cents": 0,
      "buffer_close_cents": 0,
      "shortfall_cents": 8750
    },
    {
      "week": 7,
      "gross_earnings_cents": 78750,
      "work_costs_cents": 38125,
      "net_work_income_cents": 40625,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": 625,
      "buffer_open_cents": 0,
      "buffer_close_cents": 625,
      "shortfall_cents": 0
    },
    {
      "week": 8,
      "gross_earnings_cents": 90000,
      "work_costs_cents": 40000,
      "net_work_income_cents": 50000,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": 10000,
      "buffer_open_cents": 625,
      "buffer_close_cents": 10625,
      "shortfall_cents": 0
    },
    {
      "week": 9,
      "gross_earnings_cents": 90000,
      "work_costs_cents": 40000,
      "net_work_income_cents": 50000,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": 10000,
      "buffer_open_cents": 10625,
      "buffer_close_cents": 20625,
      "shortfall_cents": 0
    },
    {
      "week": 10,
      "gross_earnings_cents": 90000,
      "work_costs_cents": 40000,
      "net_work_income_cents": 50000,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": 10000,
      "buffer_open_cents": 20625,
      "buffer_close_cents": 30625,
      "shortfall_cents": 0
    },
    {
      "week": 11,
      "gross_earnings_cents": 90000,
      "work_costs_cents": 40000,
      "net_work_income_cents": 50000,
      "essential_expenses_cents": 40000,
      "one_off_cost_cents": 0,
      "net_cash_flow_cents": 10000,
      "buffer_open_cents": 30625,
      "buffer_close_cents": 40625,
      "shortfall_cents": 0
    }
  ],
  "actions": [
    {
      "id": "buffer-runs-out-after-shock",
      "title": "Savings run out while income is recovering",
      "detail": "Your savings are estimated to cover the disruption itself but run out in week 5, before earnings return to their usual level.",
      "severity": "attention",
      "resource_ids": [
        "supportgowhere"
      ]
    },
    {
      "id": "fixed-work-costs-continue",
      "title": "Fixed work costs continue",
      "detail": "S$250.00 of weekly work costs are treated as fixed, so they continue even in a week with reduced earnings. It is worth checking whether rental, insurance, or subscription costs can be paused or reduced.",
      "severity": "info",
      "resource_ids": []
    },
    {
      "id": "check-support-schemes",
      "title": "Check which support you could apply for",
      "detail": "The Scheme Navigator can pre-screen you against maintained scheme rules. Only the relevant agency can confirm eligibility.",
      "severity": "info",
      "resource_ids": [
        "supportgowhere",
        "msf",
        "mom",
        "cpf"
      ]
    }
  ],
  "resources": [
    {
      "id": "supportgowhere",
      "name": "SupportGoWhere",
      "description": "Government directory of Singapore support schemes, with an eligibility checker.",
      "url": "https://supportgowhere.life.gov.sg",
      "last_reviewed": "2026-09-01"
    },
    {
      "id": "msf",
      "name": "Ministry of Social and Family Development",
      "description": "ComCare short-to-medium-term assistance, administered through Social Service Offices.",
      "url": "https://www.msf.gov.sg",
      "last_reviewed": "2026-09-01"
    },
    {
      "id": "mom",
      "name": "Ministry of Manpower",
      "description": "Platform worker protections, including work injury compensation.",
      "url": "https://www.mom.gov.sg",
      "last_reviewed": "2026-09-01"
    },
    {
      "id": "cpf",
      "name": "Central Provident Fund Board",
      "description": "MediSave and CPF information for self-employed and platform workers.",
      "url": "https://www.cpf.gov.sg",
      "last_reviewed": "2026-09-01"
    }
  ],
  "disclaimers": [
    "These figures are estimates calculated from the values you entered. They are not a prediction of what will happen.",
    "Resilience does not provide financial advice and does not hold or transfer your money.",
    "The estimate assumes your essential expenses and fixed work costs stay the same during the scenario.",
    "Support scheme eligibility is decided only by the relevant government agency."
  ]
};
