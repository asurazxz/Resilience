/**
 * Week-by-week emergency buffer, drawn as plain SVG so the prototype needs no
 * charting dependency. Weeks with an unmet shortfall are marked distinctly and
 * also labelled in text, so colour is never the only signal.
 */

import { formatCentsCompact } from '../money';
import type { WeekProjection } from '../types';

export interface BufferChartProps {
  weeks: WeekProjection[];
}

const CHART_HEIGHT = 120;

export function BufferChart({ weeks }: BufferChartProps) {
  if (weeks.length === 0) {
    return null;
  }

  const peak = Math.max(...weeks.map((week) => week.buffer_close_cents), 1);
  const barWidth = 100 / weeks.length;
  const firstShortfall = weeks.find((week) => week.shortfall_cents > 0);

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium text-slate-700">
        Estimated savings, week by week
      </figcaption>
      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={
          firstShortfall
            ? `Estimated savings fall to zero in week ${firstShortfall.week} of ${weeks.length}.`
            : `Estimated savings stay above zero for all ${weeks.length} weeks shown.`
        }
        className="h-32 w-full"
      >
        {weeks.map((week, index) => {
          const height = (week.buffer_close_cents / peak) * (CHART_HEIGHT - 8);
          const depleted = week.shortfall_cents > 0 || week.buffer_close_cents === 0;
          return (
            <rect
              key={week.week}
              x={index * barWidth + barWidth * 0.15}
              y={CHART_HEIGHT - height}
              width={barWidth * 0.7}
              height={Math.max(height, depleted ? 2 : 0)}
              className={depleted ? 'fill-rose-400' : 'fill-teal-500'}
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Week 1</span>
        <span className="tabular-nums">Peak {formatCentsCompact(peak)}</span>
        <span>Week {weeks.length}</span>
      </div>
    </figure>
  );
}
