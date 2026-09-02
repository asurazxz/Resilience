/**
 * Week-by-week emergency savings, drawn as plain SVG so the prototype needs no
 * charting dependency.
 *
 * The chart opens with a "Now" bar for the savings the user starts with, and
 * marks that level with a dashed line. Without them the bars were only
 * meaningful relative to each other: a scenario that drained savings and one
 * that grew them both rendered as a row of bars with no reference point.
 *
 * Weeks with an unmet shortfall are marked distinctly and also named in the
 * chart's text description, so colour is never the only signal.
 *
 * Labels are HTML rather than SVG text because the viewBox is stretched to fit
 * its container, which would distort any text drawn inside it.
 */

import { formatCentsCompact } from '../money';
import type { WeekProjection } from '../types';

export interface BufferChartProps {
  weeks: WeekProjection[];
}

const CHART_HEIGHT = 120;
const TOP_PADDING = 8;

interface Bar {
  key: string;
  valueCents: number;
  isStart: boolean;
  depleted: boolean;
  label: string;
}

export function BufferChart({ weeks }: BufferChartProps) {
  if (weeks.length === 0) {
    return null;
  }

  const startingCents = weeks[0].buffer_open_cents;

  const bars: Bar[] = [
    {
      key: 'now',
      valueCents: startingCents,
      isStart: true,
      depleted: false,
      label: `Now: ${formatCentsCompact(startingCents)}`,
    },
    ...weeks.map((week) => ({
      key: `week-${week.week}`,
      valueCents: week.buffer_close_cents,
      isStart: false,
      depleted: week.shortfall_cents > 0 || week.buffer_close_cents === 0,
      label: `Week ${week.week}: ${formatCentsCompact(week.buffer_close_cents)}`,
    })),
  ];

  const peak = Math.max(...bars.map((bar) => bar.valueCents), 1);
  const barWidth = 100 / bars.length;
  const scale = (cents: number) => (cents / peak) * (CHART_HEIGHT - TOP_PADDING);
  const startingLineY = CHART_HEIGHT - scale(startingCents);
  const firstShortfall = weeks.find((week) => week.shortfall_cents > 0);
  const endingCents = weeks[weeks.length - 1].buffer_close_cents;

  return (
    <figure className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <figcaption className="text-sm font-medium text-slate-700">
          Estimated savings, week by week
        </figcaption>
        <span className="shrink-0 text-xs tabular-nums text-slate-500">
          Top {formatCentsCompact(peak)}
        </span>
      </div>

      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={
          firstShortfall
            ? `Savings start at ${formatCentsCompact(startingCents)} and fall to zero in week ${firstShortfall.week} of ${weeks.length}.`
            : `Savings start at ${formatCentsCompact(startingCents)} and end at ${formatCentsCompact(endingCents)} after ${weeks.length} weeks, without reaching zero.`
        }
        className="h-32 w-full"
      >
        {bars.map((bar, index) => {
          const height = scale(bar.valueCents);
          return (
            <rect
              key={bar.key}
              x={index * barWidth + barWidth * 0.15}
              y={CHART_HEIGHT - height}
              width={barWidth * 0.7}
              height={Math.max(height, bar.depleted ? 2 : 0)}
              className={
                bar.depleted ? 'fill-rose-400' : bar.isStart ? 'fill-slate-300' : 'fill-teal-500'
              }
            >
              <title>{bar.label}</title>
            </rect>
          );
        })}

        <line
          x1={0}
          x2={100}
          y1={startingLineY}
          y2={startingLineY}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
          className="stroke-slate-400"
        />
        <line
          x1={0}
          x2={100}
          y1={CHART_HEIGHT}
          y2={CHART_HEIGHT}
          vectorEffect="non-scaling-stroke"
          className="stroke-slate-300"
        />
      </svg>

      <div className="flex justify-between text-xs text-slate-500">
        <span>Now</span>
        <span>Week {weeks.length}</span>
      </div>

      <p className="text-xs text-slate-500">
        The dashed line is where you started, {formatCentsCompact(startingCents)}. Bars above it
        mean you are ahead of where you began; the bottom of the chart is zero.
      </p>
    </figure>
  );
}
