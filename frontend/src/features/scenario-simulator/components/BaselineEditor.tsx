/**
 * Editable figures for the user's usual week.
 *
 * feature/01-foundation-input owns the real manual-entry flow. This panel
 * exists so the simulator can be driven with the user's own numbers before
 * that lands, and should be replaced by the shared intake rather than grown.
 *
 * The derived net income and surplus shown here come from the API response.
 * They are not recalculated in the browser, so there is only one place these
 * figures are ever worked out.
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
    <details className="rounded-xl border border-slate-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900">
        Your usual week
        {summary ? (
          <span className="ml-2 font-normal text-slate-500">
            {formatCents(summary.weekly_net_work_income_cents)} work income,{' '}
            {formatCents(summary.emergency_savings_cents)} saved
          </span>
        ) : null}
      </summary>

      <div className="space-y-4 px-4 pb-4">
        <p className="text-xs text-slate-600">
          Change these to match your own situation. Everything below the controls updates to match.
        </p>

        <MoneyField
          id="baseline-gross"
          label="Weekly earnings before costs"
          valueCents={baseline.weekly_gross_earnings_cents}
          hint="What the platforms pay you in a normal week."
          onChange={(cents) => onChange({ weekly_gross_earnings_cents: cents })}
        />

        <MoneyField
          id="baseline-variable-costs"
          label="Weekly costs that change with the work"
          valueCents={baseline.weekly_variable_work_costs_cents}
          hint="Fuel, commission, and anything that falls when you drive or deliver less."
          onChange={(cents) => onChange({ weekly_variable_work_costs_cents: cents })}
        />

        <MoneyField
          id="baseline-fixed-costs"
          label="Weekly costs that continue anyway"
          valueCents={baseline.weekly_fixed_work_costs_cents}
          hint="Vehicle rental, insurance, or a phone plan you pay even in a week off."
          onChange={(cents) => onChange({ weekly_fixed_work_costs_cents: cents })}
        />

        <MoneyField
          id="baseline-essentials"
          label="Weekly essential expenses"
          valueCents={baseline.weekly_essential_expenses_cents}
          hint="Rent, food, utilities, and other living costs you cannot skip."
          onChange={(cents) => onChange({ weekly_essential_expenses_cents: cents })}
        />

        <MoneyField
          id="baseline-savings"
          label="Emergency savings"
          valueCents={baseline.emergency_savings_cents}
          hint="What you could draw on today if your income stopped."
          onChange={(cents) => onChange({ emergency_savings_cents: cents })}
        />

        {summary ? (
          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
            <div>
              <dt className="text-slate-500">Net work income</dt>
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
    </details>
  );
}
