/**
 * The adjustable shock inputs: reduced earnings, time away from work,
 * an unexpected cost, and how long earnings take to recover.
 */

import { useState } from 'react';

import { dollarsToCents, formatCents } from '../money';
import type { ShockScenarioPayload } from '../types';

/**
 * Keep only digits and a single decimal point of at most two places, and drop
 * leading zeros.
 *
 * The field is a text input rather than type="number" on purpose. React
 * compares a controlled number input's DOM string to the new value loosely, so
 * "0123" tests equal to 123 and the stranded leading zero is never rewritten.
 */
function sanitiseAmount(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  const trimmedWhole = whole.replace(/^0+(?=\d)/, '');
  if (rest.length === 0) {
    return trimmedWhole;
  }
  return `${trimmedWhole}.${rest.join('').slice(0, 2)}`;
}

function centsToDraft(cents: number): string {
  return cents === 0 ? '' : String(cents / 100);
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
      <div className="flex items-baseline justify-between gap-3">
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
        className="h-6 w-full cursor-pointer accent-teal-600"
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export interface ScenarioControlsProps {
  scenario: ShockScenarioPayload;
  onChange: (patch: Partial<ShockScenarioPayload>) => void;
}

export function ScenarioControls({ scenario, onChange }: ScenarioControlsProps) {
  // The field holds text while being edited so partial entries such as "12."
  // survive; the scenario keeps the authoritative cent value.
  const [costDraft, setCostDraft] = useState(() => centsToDraft(scenario.unexpected_cost_cents));

  function handleCostChange(raw: string) {
    const next = sanitiseAmount(raw);
    setCostDraft(next);
    const parsed = Number(next);
    onChange({
      unexpected_cost_cents: next === '' || Number.isNaN(parsed) ? 0 : dollarsToCents(parsed),
    });
  }

  return (
    <section aria-labelledby="scenario-controls-heading" className="space-y-5">
      <div>
        <h2 id="scenario-controls-heading" className="text-base font-semibold text-slate-900">
          What are you preparing for?
        </h2>
        <p className="text-sm text-slate-600">
          Adjust the situation below to see the estimated effect on your weekly money and savings.
        </p>
      </div>

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

      <div className="space-y-1">
        <label htmlFor="unexpected-cost" className="text-sm font-medium text-slate-700">
          One-off unexpected cost
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">S$</span>
          <input
            id="unexpected-cost"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={costDraft}
            onChange={(event) => handleCostChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <p className="text-xs text-slate-500">
          For example a vehicle repair or a medical bill. Applied in the first week
          {scenario.unexpected_cost_cents > 0
            ? `: ${formatCents(scenario.unexpected_cost_cents)}.`
            : '.'}
        </p>
      </div>
    </section>
  );
}
