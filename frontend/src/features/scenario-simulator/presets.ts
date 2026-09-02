/**
 * Common situations a platform worker might want to prepare for.
 *
 * People think in situations rather than in percentages, so these translate a
 * recognisable event into the shock inputs the engine expects. The values are
 * starting points the user can then adjust, not claims about how any real
 * event unfolds.
 */

import type { ShockScenarioPayload } from './types';

export interface SituationPreset {
  id: string;
  label: string;
  detail: string;
  scenario: ShockScenarioPayload;
}

export const SITUATION_PRESETS: readonly SituationPreset[] = [
  {
    id: 'work-dries-up',
    label: 'Work dries up',
    detail: 'Fewer jobs for a while, then it picks back up.',
    scenario: {
      income_reduction_percent: 40,
      weeks_affected: 6,
      unexpected_cost_cents: 0,
      recovery_weeks: 3,
    },
  },
  {
    id: 'injured',
    label: 'Injured or unwell',
    detail: 'You cannot work at all for a month.',
    scenario: {
      income_reduction_percent: 100,
      weeks_affected: 4,
      unexpected_cost_cents: 0,
      recovery_weeks: 4,
    },
  },
  {
    id: 'something-breaks',
    label: 'Something breaks',
    detail: 'A S$800 repair or bill lands this week.',
    scenario: {
      income_reduction_percent: 0,
      weeks_affected: 0,
      unexpected_cost_cents: 80_000,
      recovery_weeks: 0,
    },
  },
];

export const DEFAULT_SCENARIO: ShockScenarioPayload = SITUATION_PRESETS[0].scenario;

/** Which preset the current inputs correspond to, or null once they are adjusted. */
export function matchPresetId(scenario: ShockScenarioPayload): string | null {
  const found = SITUATION_PRESETS.find(
    (preset) =>
      preset.scenario.income_reduction_percent === scenario.income_reduction_percent &&
      preset.scenario.weeks_affected === scenario.weeks_affected &&
      preset.scenario.unexpected_cost_cents === scenario.unexpected_cost_cents &&
      preset.scenario.recovery_weeks === scenario.recovery_weeks,
  );
  return found ? found.id : null;
}
