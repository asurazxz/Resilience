/**
 * The working behind the headline figures.
 *
 * Always visible: a user who doubts the estimate should be able to trace it
 * week by week without first discovering a control.
 */

import type { WeekProjection } from '../types';
import { BufferChart } from './BufferChart';
import { WeeklyBreakdown } from './WeeklyBreakdown';

export interface ResultDetailsProps {
  weeks: WeekProjection[];
}

export function ResultDetails({ weeks }: ResultDetailsProps) {
  return (
    <section
      aria-labelledby="how-worked-out"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
    >
      <h3 id="how-worked-out" className="text-sm font-semibold text-slate-900">
        How this was worked out
      </h3>
      <BufferChart weeks={weeks} />
      <WeeklyBreakdown weeks={weeks} />
    </section>
  );
}
