/**
 * Fine adjustments to the situation: how much earnings fall, for how long,
 * how long they take to recover, and any one-off cost.
 *
 * These sit below the situation cards because most users only need to pick a
 * situation; the sliders are for adjusting one that is nearly right.
 */

import { formatCents } from '../money';
import type { ShockScenarioPayload } from '../types';
import { MoneyField } from './MoneyField';

export interface ScenarioControlsProps {
  scenario: ShockScenarioPayload;
  onChange: (patch: Partial<ShockScenarioPayload>) => void;
}

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueLabel: string;
  hint?: string;
  onChange: (value: number) => void;
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  valueLabel,
  hint,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <span className="text-sm font-semibold tabular-nums text-slate-900">{valueLabel}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-teal-700"
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ScenarioControls({ scenario, onChange }: ScenarioControlsProps) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
        Adjust the details
      </summary>

      <div className="space-y-5 px-4 pb-4">
        <SliderField
          id="income-reduction"
          label="Earnings drop by"
          value={scenario.income_reduction_percent}
          min={0}
          max={100}
          step={5}
          valueLabel={`${scenario.income_reduction_percent}%`}
          hint={
            scenario.income_reduction_percent === 100
              ? 'No earnings at all, for example time off after an injury.'
              : 'How much less you expect to earn each week.'
          }
          onChange={(value) => onChange({ income_reduction_percent: value })}
        />

        <SliderField
          id="weeks-affected"
          label="For"
          value={scenario.weeks_affected}
          min={0}
          max={26}
          valueLabel={scenario.weeks_affected === 1 ? '1 week' : `${scenario.weeks_affected} weeks`}
          onChange={(value) => onChange({ weeks_affected: value })}
        />

        <SliderField
          id="recovery-weeks"
          label="Then earnings recover over"
          value={scenario.recovery_weeks}
          min={0}
          max={12}
          valueLabel={
            scenario.recovery_weeks === 0
              ? 'Straight away'
              : scenario.recovery_weeks === 1
                ? '1 week'
                : `${scenario.recovery_weeks} weeks`
          }
          hint="Earnings climb back to your usual level over this period."
          onChange={(value) => onChange({ recovery_weeks: value })}
        />

        <MoneyField
          id="unexpected-cost"
          label="One-off unexpected cost"
          valueCents={scenario.unexpected_cost_cents}
          hint={
            scenario.unexpected_cost_cents > 0
              ? `A repair or bill, counted in the first week: ${formatCents(scenario.unexpected_cost_cents)}.`
              : 'A repair or bill, counted in the first week.'
          }
          onChange={(cents) => onChange({ unexpected_cost_cents: cents })}
        />
      </div>
    </details>
  );
}
