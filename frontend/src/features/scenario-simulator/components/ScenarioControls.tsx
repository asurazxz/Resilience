/**
 * The details of the setback: how much less you would earn, for how long,
 * how long it takes earnings to recover, and any one-off cost.
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
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="label">
          {label}
        </label>
        <span className="ink-key font-semibold tabular-nums">
          {valueLabel}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
        style={{ accentColor: 'var(--color-pure)' }}
      />
      {hint ? <p className="body-text-sm">{hint}</p> : null}
    </div>
  );
}

export function ScenarioControls({ scenario, onChange }: ScenarioControlsProps) {
  return (
    <div className="card space-y-6">
      <h3 className="subheading">Describe the setback</h3>

      <div className="space-y-6">
        <SliderField
          id="income-reduction"
          label="How much less you would earn"
          value={scenario.income_reduction_percent}
          min={0}
          max={100}
          step={5}
          valueLabel={`${scenario.income_reduction_percent}%`}
          hint={
            scenario.income_reduction_percent === 100
              ? 'No earnings at all — for example, time off after an injury.'
              : 'A drop in your usual weekly earnings, not the exact amount.'
          }
          onChange={(value) => onChange({ income_reduction_percent: value })}
        />

        <SliderField
          id="weeks-affected"
          label="How many weeks this lasts"
          value={scenario.weeks_affected}
          min={0}
          max={26}
          valueLabel={scenario.weeks_affected === 1 ? '1 week' : `${scenario.weeks_affected} weeks`}
          onChange={(value) => onChange({ weeks_affected: value })}
        />

        <SliderField
          id="recovery-weeks"
          label="How long it takes your earnings to recover"
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
          hint="After the setback ends, earnings climb back to your usual level over this many weeks."
          onChange={(value) => onChange({ recovery_weeks: value })}
        />

        <MoneyField
          id="unexpected-cost"
          label="A one-off bill or repair, if there is one"
          valueCents={scenario.unexpected_cost_cents}
          hint={
            scenario.unexpected_cost_cents > 0
              ? `Counted as a cost in the first week: ${formatCents(scenario.unexpected_cost_cents)}.`
              : 'Leave this at S$0 if nothing unexpected comes up.'
          }
          onChange={(cents) => onChange({ unexpected_cost_cents: cents })}
        />
      </div>
    </div>
  );
}
