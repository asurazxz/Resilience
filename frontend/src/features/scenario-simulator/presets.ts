/**
 * The scenario the setback planner opens with.
 *
 * There is no preset picker on screen — the user customises the sliders
 * directly — but useScenarioSimulator still needs somewhere to start.
 */

import type { ShockScenarioPayload } from './types';

export const DEFAULT_SCENARIO: ShockScenarioPayload = {
  income_reduction_percent: 40,
  weeks_affected: 6,
  unexpected_cost_cents: 0,
  recovery_weeks: 3,
};
