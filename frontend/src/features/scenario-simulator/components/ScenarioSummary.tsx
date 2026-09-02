/**
 * Supporting figures beneath the headline answer.
 *
 * Each pairs the scenario figure with the user's normal week, so the number
 * reads as a change rather than as an isolated amount. Labels avoid finance
 * vocabulary: the audience is a worker checking whether they would cope, not
 * an accountant.
 */

import { formatCents } from '../money';
import type { BaselineSummary, ScenarioSummary as ScenarioSummaryData } from '../types';

export interface ScenarioSummaryProps {
  baseline: BaselineSummary;
  scenario: ScenarioSummaryData;
}

interface StatProps {
  label: string;
  value: string;
  detail: string;
  tone?: 'plain' | 'bad';
}

function Stat({ label, value, detail, tone = 'plain' }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          tone === 'bad' ? 'text-rose-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
    </div>
  );
}

export function ScenarioSummary({ baseline, scenario }: ScenarioSummaryProps) {
  const weeklyFlow = scenario.weekly_net_cash_flow_during_shock_cents;
  const weeklyIncome = scenario.weekly_net_work_income_during_shock_cents;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat
        label="Left each week"
        value={formatCents(weeklyFlow)}
        detail={`Normally ${formatCents(baseline.weekly_surplus_cents)} a week`}
        tone={weeklyFlow < 0 ? 'bad' : 'plain'}
      />
      <Stat
        label="You keep from work"
        value={formatCents(weeklyIncome)}
        detail={`Normally ${formatCents(baseline.weekly_net_work_income_cents)}, after work costs`}
        tone={weeklyIncome < 0 ? 'bad' : 'plain'}
      />
      <Stat
        label="Short by"
        value={formatCents(scenario.total_shortfall_cents)}
        detail={
          scenario.total_shortfall_cents > 0
            ? `Across the ${scenario.horizon_weeks} weeks shown`
            : 'Your savings cover this'
        }
        tone={scenario.total_shortfall_cents > 0 ? 'bad' : 'plain'}
      />
      <Stat
        label="Savings low point"
        value={formatCents(scenario.lowest_buffer_cents)}
        detail={
          // "from today's savings" would imply a fall, which is wrong whenever
          // the weakest projected week still sits above what they hold now.
          scenario.lowest_buffer_cents < baseline.emergency_savings_cents
            ? `In week ${scenario.lowest_buffer_week}, down from ${formatCents(baseline.emergency_savings_cents)}`
            : `In week ${scenario.lowest_buffer_week}, never below today's ${formatCents(baseline.emergency_savings_cents)}`
        }
        tone={scenario.lowest_buffer_cents === 0 ? 'bad' : 'plain'}
      />
    </div>
  );
}
