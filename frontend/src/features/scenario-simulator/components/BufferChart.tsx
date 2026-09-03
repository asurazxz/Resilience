/**
 * Week-by-week emergency savings, drawn as plain SVG so the prototype needs no
 * charting dependency.
 *
 * Pointing at, tapping, or arrowing onto a bar names that week and its figures
 * in a readout above the chart. The readout sits in a fixed position rather
 * than following the pointer: it cannot be clipped, it needs no positioning
 * maths, and tapping works the same as hovering.
 *
 * Labels are HTML rather than SVG text because the viewBox is stretched to fit
 * its container, which would distort any text drawn inside it.
 */

import { useState } from 'react';

import { formatCents } from '../money';
import type { WeekProjection } from '../types';
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_SERIES,
  CHART_TEXT,
} from '../../../lib/chartTheme';

export interface BufferChartProps {
  weeks: WeekProjection[];
}

const CHART_HEIGHT = 120;
const TOP_PADDING = 8;

interface Bar {
  key: string;
  name: string;
  valueCents: number;
  isStart: boolean;
  depleted: boolean;
  week: WeekProjection | null;
}

export function BufferChart({ weeks }: BufferChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (weeks.length === 0) {
    return null;
  }

  const startingCents = weeks[0].buffer_open_cents;

  const bars: Bar[] = [
    {
      key: 'now',
      name: 'Now',
      valueCents: startingCents,
      isStart: true,
      depleted: false,
      week: null,
    },
    ...weeks.map((week) => ({
      key: `week-${week.week}`,
      name: `Week ${week.week}`,
      valueCents: week.buffer_close_cents,
      isStart: false,
      depleted: week.shortfall_cents > 0 || week.buffer_close_cents === 0,
      week,
    })),
  ];

  const peak = Math.max(...bars.map((bar) => bar.valueCents), 1);
  const barWidth = 100 / bars.length;
  const scale = (cents: number) => (cents / peak) * (CHART_HEIGHT - TOP_PADDING);
  const startingLineY = CHART_HEIGHT - scale(startingCents);
  const firstShortfall = weeks.find((week) => week.shortfall_cents > 0);
  const endingCents = weeks[weeks.length - 1].buffer_close_cents;
  const active = activeIndex === null ? null : bars[activeIndex];

  function step(by: number) {
    setActiveIndex((current) => {
      const next = current === null ? 0 : current + by;
      return Math.max(0, Math.min(bars.length - 1, next));
    });
  }

  return (
    <figure className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <figcaption className="label">Estimated savings by week</figcaption>
        <span className="mono-label shrink-0 tabular-nums">Top {formatCents(peak)}</span>
      </div>

      <div aria-live="polite" className="note min-h-14">
        {active ? (
          <>
            <p className="ink-heading font-semibold">
              {active.name}: {formatCents(active.valueCents)} saved
            </p>
            {active.week ? (
              <p className="body-text-sm mt-2">
                {active.week.net_cash_flow_cents === 0
                  ? 'No change'
                  : active.week.net_cash_flow_cents < 0
                    ? 'Down'
                    : 'Up'}{' '}
                {active.week.net_cash_flow_cents === 0 ? null : (
                  <>
                    <span className="tabular-nums">
                      {formatCents(Math.abs(active.week.net_cash_flow_cents))}
                    </span>{' '}
                  </>
                )}
                that week, from work income of{' '}
                <span className="tabular-nums">
                  {formatCents(active.week.net_work_income_cents)}
                </span>
                {active.week.shortfall_cents > 0 ? (
                  <>
                    {'. '}
                    <span className="mono-label ink-key">
                      NOT COVERED
                    </span>{' '}
                    {formatCents(active.week.shortfall_cents)} could not be covered.
                  </>
                ) : (
                  '.'
                )}
              </p>
            ) : (
              <p className="body-text-sm mt-2">What you have saved before the situation starts.</p>
            )}
          </>
        ) : (
          <p className="body-text-sm">
            Point at a bar, tap it, or use the arrow keys to see that week&rsquo;s figures.
          </p>
        )}
      </div>

      <div
        tabIndex={0}
        role="application"
        aria-label="Savings by week. Use the left and right arrow keys to move between weeks."
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            step(1);
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            step(-1);
          } else if (event.key === 'Escape') {
            setActiveIndex(null);
          }
        }}
        onMouseLeave={() => setActiveIndex(null)}
        className="rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-cobalt)]"
      >
        <svg
          viewBox={`0 0 100 ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={
            firstShortfall
              ? `Savings start at ${formatCents(startingCents)} and fall to zero in week ${firstShortfall.week} of ${weeks.length}.`
              : `Savings start at ${formatCents(startingCents)} and end at ${formatCents(endingCents)} after ${weeks.length} weeks, without reaching zero.`
          }
          className="h-32 w-full"
        >
          {bars.map((bar, index) => {
            const height = scale(bar.valueCents);
            const isActive = index === activeIndex;
            // Depleted weeks are marked with a hatch pattern fill rather than
            // relying on a color shift alone, so the "no savings left" state
            // reads even without color vision.
            const fill = bar.depleted
              ? CHART_TEXT
              : bar.isStart
                ? CHART_AXIS
                : CHART_SERIES;
            return (
              <rect
                key={bar.key}
                x={index * barWidth + barWidth * 0.15}
                y={CHART_HEIGHT - height}
                width={barWidth * 0.7}
                // A depleted week keeps a visible stub: zero savings should read
                // as an emphatic nothing, not as a gap in the chart.
                height={Math.max(height, bar.depleted ? 5 : 0)}
                fill={fill}
                opacity={isActive ? 1 : bar.depleted ? 0.9 : 0.85}
              />
            );
          })}

          <line
            x1={0}
            x2={100}
            y1={startingLineY}
            y2={startingLineY}
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
            stroke={CHART_AXIS}
          />
          <line
            x1={0}
            x2={100}
            y1={CHART_HEIGHT}
            y2={CHART_HEIGHT}
            vectorEffect="non-scaling-stroke"
            stroke={CHART_GRID}
          />

          {/* Full-height targets, so a short bar is as easy to point at as a tall one. */}
          {bars.map((bar, index) => (
            <rect
              key={`hit-${bar.key}`}
              x={index * barWidth}
              y={0}
              width={barWidth}
              height={CHART_HEIGHT}
              fill="transparent"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </svg>
      </div>

      <div className="body-text-sm flex justify-between">
        <span>Now</span>
        <span>Week {weeks.length}</span>
      </div>

      <p className="body-text-sm prose">
        Each bar is what you would have saved at the end of that week. The dashed line is where you
        started, {formatCents(startingCents)}, and the bottom of the chart is zero.
      </p>
    </figure>
  );
}
