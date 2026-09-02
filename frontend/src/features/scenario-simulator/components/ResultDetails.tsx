/**
 * The working behind the headline figures, collapsed by default.
 *
 * Kept available rather than removed: a user who doubts the estimate should be
 * able to trace it week by week, which is what makes the result checkable
 * rather than something to take on trust.
 */

import type { WeekProjection } from '../types';
import { BufferChart } from './BufferChart';
import { WeeklyBreakdown } from './WeeklyBreakdown';

export interface ResultDetailsProps {
  weeks: WeekProjection[];
}

export function ResultDetails({ weeks }: ResultDetailsProps) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
        See how this was worked out
      </summary>
      <div className="space-y-4 px-4 pb-4">
        <BufferChart weeks={weeks} />
        <WeeklyBreakdown weeks={weeks} />
      </div>
    </details>
  );
}
