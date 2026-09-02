/**
 * The user's usual week, always visible and always editable.
 *
 * feature/01-foundation-input owns the real manual-entry flow. This panel
 * exists so the simulator can be driven with the user's own numbers before
 * that lands, and should be replaced by the shared intake rather than grown.
 *
 * The derived net income and surplus come from the API response. They are not
 * recalculated in the browser, so those figures are only ever worked out in
 * the deterministic engine.
 */

import { formatCents } from '../money';
import type { BaselineFinancesPayload, BaselineSummary } from '../types';
import { MoneyField } from './MoneyField';

export interface BaselineEditorProps {
  baseline: BaselineFinancesPayload;
  summary: BaselineSummary | null;
  onChange: (patch: Partial<BaselineFinancesPayload>) => void;
}

export function BaselineEditor({ baseline, summary, onChange }: BaselineEditorProps) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <MoneyField
        id="baseline-gross"
        label="Weekly earnings, before costs"
        valueCents={baseline.weekly_gross_earnings_cents}
        hint="What the platforms pay you in a normal week."
        onChange={(cents) => onChange({ weekly_gross_earnings_cents: cents })}
      />

      <MoneyField
        id="baseline-variable-costs"
        label="Costs that fall when you work less"
        valueCents={baseline.weekly_variable_work_costs_cents}
        hint="Fuel, commission, parking."
        onChange={(cents) => onChange({ weekly_variable_work_costs_cents: cents })}
      />

      <MoneyField
        id="baseline-fixed-costs"
        label="Costs you pay even in a week off"
        valueCents={baseline.weekly_fixed_work_costs_cents}
        hint="Vehicle rental, insurance, phone plan. This one matters most in a bad week."
        onChange={(cents) => onChange({ weekly_fixed_work_costs_cents: cents })}
      />

      <MoneyField
        id="baseline-essentials"
        label="Weekly living costs"
        valueCents={baseline.weekly_essential_expenses_cents}
        hint="Rent, food, utilities, family support."
        onChange={(cents) => onChange({ weekly_essential_expenses_cents: cents })}
      />

      <MoneyField
        id="baseline-savings"
        label="Savings you could use today"
        valueCents={baseline.emergency_savings_cents}
        hint="What you could draw on if your income stopped."
        onChange={(cents) => onChange({ emergency_savings_cents: cents })}
      />

      {summary ? (
        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
          <div>
            <dt className="text-slate-500">You keep from work</dt>
            <dd className="font-semibold tabular-nums text-slate-900">
              {formatCents(summary.weekly_net_work_income_cents)} a week
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Left after living costs</dt>
            <dd
              className={`font-semibold tabular-nums ${
                summary.weekly_surplus_cents < 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {formatCents(summary.weekly_surplus_cents)} a week
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
