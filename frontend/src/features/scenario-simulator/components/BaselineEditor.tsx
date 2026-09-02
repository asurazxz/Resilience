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

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-sm font-medium text-slate-700">
          What work costs you each week
        </legend>
        <p className="text-xs text-slate-600">
          Split these two ways. Some costs stop when you stop working, and some keep charging you
          anyway — that difference is what decides how bad a week off really is.
        </p>

        <MoneyField
          id="baseline-variable-costs"
          label="Costs that stop when you stop working"
          valueCents={baseline.weekly_variable_work_costs_cents}
          hint="Fuel, parking, commission. No work that week means you do not pay these."
          onChange={(cents) => onChange({ weekly_variable_work_costs_cents: cents })}
        />

        <MoneyField
          id="baseline-fixed-costs"
          label="Liabilities"
          valueCents={baseline.weekly_fixed_work_costs_cents}
          hint="Vehicle or bike rental, insurance, phone plan, loan repayments."
          onChange={(cents) => onChange({ weekly_fixed_work_costs_cents: cents })}
        />

        {baseline.weekly_fixed_work_costs_cents > 0 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
            So in a week you cannot work at all, you would still pay{' '}
            <span className="font-semibold tabular-nums">
              {formatCents(baseline.weekly_fixed_work_costs_cents)}
            </span>
            .
          </p>
        ) : (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            With nothing here, a week you cannot work costs you nothing to keep going. If you rent
            a vehicle or pay insurance, add it above.
          </p>
        )}
      </fieldset>

      <MoneyField
        id="baseline-essentials"
        label="Weekly essentials"
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
            <dt className="text-slate-500">Left after essentials</dt>
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
