/**
 * The plain-language answer to the question the page exists to ask.
 *
 * The sentence is assembled from figures the engine returned. No amount is
 * derived here; only the wording is chosen.
 */

import { formatCents, formatWeeks } from '../money';
import type { ScenarioSummary } from '../types';

export interface HeadlineAnswerProps {
  scenario: ScenarioSummary;
}

export function HeadlineAnswer({ scenario }: HeadlineAnswerProps) {
  const holds = scenario.buffer_holds_through_horizon;
  const runway = scenario.buffer_runway_weeks;

  let figure: string;
  let headline: string;
  let support: string;

  if (holds) {
    figure = 'Covered';
    headline = 'Your savings would cover this.';
    support = `At the lowest point you would still have ${formatCents(
      scenario.lowest_buffer_cents,
    )}, in week ${scenario.lowest_buffer_week}.`;
  } else if (runway === 0) {
    figure = 'week 1';
    headline = 'Your savings would not cover this.';
    support = `You would be short straight away, by about ${formatCents(
      scenario.total_shortfall_cents,
    )} across the ${formatWeeks(scenario.horizon_weeks)} shown.`;
  } else {
    figure = formatWeeks(runway ?? 0);
    headline = `Your savings would last about ${formatWeeks(runway ?? 0)}.`;
    support = `After that you would be short by about ${formatCents(
      scenario.total_shortfall_cents,
    )} across the ${formatWeeks(scenario.horizon_weeks)} shown.`;
  }

  return (
    <div className={holds ? 'tile tile-accent' : 'tile tile-muted'}>
      <span className="mono-label">{holds ? '✓ ON TRACK' : '⚠ SHORTFALL'}</span>
      <p className="display-lg ink-key mt-3 tabular-nums">{figure}</p>
      <p className={`subheading mt-3 ${holds ? 'ink-key' : 'ink-heading'}`}>{headline}</p>
      <p className={`mt-3 prose ${holds ? 'ink-key' : 'body-text-sm'}`}>{support}</p>
    </div>
  );
}
