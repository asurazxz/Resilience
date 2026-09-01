/**
 * Headline estimates: weekly cash flow during the shock and how long the
 * emergency buffer is estimated to last.
 */

import { formatCents, formatWeeks } from '../money';
import type { BaselineSummary, ScenarioSummary as ScenarioSummaryData } from '../types';

interface StatProps {
  label: string;
  value: string;
  detail?: string;
  tone?: 'neutral' | 'attention';
}

function Stat({ label, value, detail, tone = 'neutral' }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums ${
          tone === 'attention' ? 'text-rose-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-slate-600">{detail}</p> : null}
    </div>
  );
}

export interface ScenarioSummaryProps {
  baseline: BaselineSummary;
  scenario: ScenarioSummaryData;
}

export function ScenarioSummary({ baseline, scenario }: ScenarioSummaryProps) {
  const runwayValue = scenario.buffer_holds_through_horizon
    ? `Beyond ${formatWeeks(scenario.horizon_weeks)}`
    : formatWeeks(scenario.buffer_runway_weeks ?? 0);

  return (
    <section aria-labelledby="scenario-summary-heading" className="space-y-3">
      <h2 id="scenario-summary-heading" className="text-base font-semibold text-slate-900">
        Estimated impact
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Savings last"
          value={runwayValue}
          detail={
            scenario.buffer_holds_through_horizon
              ? `Lowest point ${formatCents(scenario.lowest_buffer_cents)} in week ${scenario.lowest_buffer_week}`
              : `Money runs out in week ${scenario.first_shortfall_week}`
          }
          tone={scenario.buffer_holds_through_horizon ? 'neutral' : 'attention'}
        />
        <Stat
          label="Weekly money left"
          value={formatCents(scenario.weekly_net_cash_flow_during_shock_cents)}
          detail={`Usually ${formatCents(baseline.weekly_surplus_cents)} a week`}
          tone={scenario.weekly_net_cash_flow_during_shock_cents < 0 ? 'attention' : 'neutral'}
        />
        <Stat
          label="Weekly work income"
          value={formatCents(scenario.weekly_net_work_income_during_shock_cents)}
          detail={`After work costs. Usually ${formatCents(baseline.weekly_net_work_income_cents)}`}
        />
        <Stat
          label="Not covered"
          value={formatCents(scenario.total_shortfall_cents)}
          detail={
            scenario.total_shortfall_cents > 0
              ? `Across the ${formatWeeks(scenario.horizon_weeks)} shown`
              : 'Your savings cover this scenario'
          }
          tone={scenario.total_shortfall_cents > 0 ? 'attention' : 'neutral'}
        />
      </div>
      {scenario.full_income_resumes_week ? (
        <p className="text-sm text-slate-600">
          Earnings return to their usual level in week {scenario.full_income_resumes_week}.
        </p>
      ) : null}
    </section>
  );
}
