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
    <div className="card space-y-6">
      <MoneyField
        id="baseline-gross"
        label="Weekly earnings, before costs"
        valueCents={baseline.weekly_gross_earnings_cents}
        hint="What the platforms pay you in a normal week."
        onChange={(cents) => onChange({ weekly_gross_earnings_cents: cents })}
      />

      <fieldset className="space-y-6 rounded-lg p-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <legend className="label px-1">
          What it costs you to work each week
        </legend>
        <p className="body-text-sm prose">
          Split these into two kinds, because they behave differently in a week you do not
          work: some costs disappear when you stop, others keep charging you anyway.
        </p>

        <MoneyField
          id="baseline-variable-costs"
          label="Costs that only happen when you work"
          valueCents={baseline.weekly_variable_work_costs_cents}
          hint="Fuel, parking, commission. If you do not work that week, you do not pay these."
          onChange={(cents) => onChange({ weekly_variable_work_costs_cents: cents })}
        />

        <MoneyField
          id="baseline-fixed-costs"
          label="Costs you pay every week, whether you work or not"
          valueCents={baseline.weekly_fixed_work_costs_cents}
          hint="Vehicle or bike rental, insurance, phone plan, loan repayments."
          onChange={(cents) => onChange({ weekly_fixed_work_costs_cents: cents })}
        />

        {baseline.weekly_fixed_work_costs_cents > 0 ? (
          <p className="note">
            So in a week you cannot work at all, you would still have to pay{' '}
            <span className="ink-key font-semibold tabular-nums">
              {formatCents(baseline.weekly_fixed_work_costs_cents)}
            </span>
            .
          </p>
        ) : (
          <p className="note">
            With nothing entered here, a week you cannot work costs you nothing extra. If you
            rent a vehicle or pay insurance, add it above.
          </p>
        )}
      </fieldset>

      <MoneyField
        id="baseline-essentials"
        label="What you need to spend each week to get by"
        valueCents={baseline.weekly_essential_expenses_cents}
        hint="Rent, food, utilities, family support."
        onChange={(cents) => onChange({ weekly_essential_expenses_cents: cents })}
      />

      <MoneyField
        id="baseline-savings"
        label="Savings you could use right now"
        valueCents={baseline.emergency_savings_cents}
        hint="Money you could draw on today if your income stopped."
        onChange={(cents) => onChange({ emergency_savings_cents: cents })}
      />

      {summary ? (
        <dl className="note grid grid-cols-2 gap-6">
          <div>
            <dt className="mono-label">What you keep from work</dt>
            <dd className="ink-key mt-2 font-semibold tabular-nums">
              {formatCents(summary.weekly_net_work_income_cents)} a week
            </dd>
          </div>
          <div>
            <dt className="mono-label">Left after everyday spending</dt>
            <dd className="ink-key mt-2 font-semibold tabular-nums">
              {summary.weekly_surplus_cents < 0 ? '−' : ''}
              {formatCents(Math.abs(summary.weekly_surplus_cents))} a week
              {summary.weekly_surplus_cents < 0 ? (
                <span className="mono-label ml-1">SHORTFALL</span>
              ) : null}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
