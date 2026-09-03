import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import { formatMoney } from "../../lib/money";
import type { SavingsContribution } from "./types";
import "./savings.css";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_SERIES,
  CHART_SERIES_MUTED,
  CHART_TEXT,
} from "../../lib/chartTheme";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface SavingsProgressPoint {
  date: string;
  timestamp: number;
  cumulativeCents: number;
}

/**
 * Sorts a goal's contributions by date and turns them into a cumulative
 * saved-over-time series. Exported so the derivation can be tested without
 * rendering the chart.
 */
export function buildSavingsProgressSeries(
  contributions: SavingsContribution[],
): SavingsProgressPoint[] {
  const sorted = [...contributions].sort((left, right) =>
    left.contributedOn.localeCompare(right.contributedOn),
  );
  let cumulativeCents = 0;
  return sorted.map((contribution) => {
    cumulativeCents += contribution.amountCents;
    return {
      date: contribution.contributedOn,
      timestamp: toTimestamp(contribution.contributedOn),
      cumulativeCents,
    };
  });
}

interface SavingsGoalChartProps {
  goalName: string;
  contributions: SavingsContribution[];
  targetCents: number;
  targetDate?: string | null;
}

export function SavingsGoalChart({
  goalName,
  contributions,
  targetCents,
  targetDate,
}: SavingsGoalChartProps) {
  const points = buildSavingsProgressSeries(contributions);

  if (points.length === 0) {
    return (
      <p className="jar-muted">
        Add a contribution to start this goal&rsquo;s progress chart.
      </p>
    );
  }

  const latestCents = points[points.length - 1].cumulativeCents;
  const description = `${goalName}: ${formatMoney(latestCents)} saved of a ${formatMoney(targetCents)} target${
    targetDate ? `, due ${targetDate}` : ""
  }.`;

  const targetTimestamp = targetDate ? toTimestamp(targetDate) : null;
  const timestamps = points.map((point) => point.timestamp);
  if (targetTimestamp !== null) timestamps.push(targetTimestamp);
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  // A single contribution (or every contribution on one date) still needs a
  // visible horizontal span rather than a zero-width axis.
  const xDomain: [number, number] =
    minTimestamp === maxTimestamp
      ? [minTimestamp - ONE_DAY_MS, maxTimestamp + ONE_DAY_MS]
      : [minTimestamp, maxTimestamp];

  return (
    <figure className="jar-chart savings-goal-chart">
      <figcaption>Progress over time</figcaption>
      <p className="jar-muted">{description}</p>
      <div className="savings-goal-chart-canvas">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart
            data={points}
            margin={{ top: 18, right: 18, bottom: 4, left: 4 }}
            accessibilityLayer
          >
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={xDomain}
              tickFormatter={shortDate}
              stroke={CHART_AXIS}
              tick={{ fontSize: 11, fill: CHART_TEXT }}
            />
            <YAxis
              domain={[0, (dataMax: number) => Math.max(dataMax, targetCents)]}
              stroke={CHART_AXIS}
              tick={{ fontSize: 11, fill: CHART_TEXT }}
              tickFormatter={compactMoney}
              width={56}
            />
            <Tooltip content={GoalChartTooltip} />
            <ReferenceLine
              y={targetCents}
              stroke={CHART_TEXT}
              strokeDasharray="6 4"
              label={{
                value: "Target",
                fill: CHART_TEXT,
                position: "insideTopRight",
                fontSize: 11,
              }}
            />
            {targetTimestamp !== null && (
              <ReferenceLine
                x={targetTimestamp}
                stroke={CHART_TEXT}
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
                label={{
                  value: "Target date",
                  fill: CHART_TEXT,
                  position: "top",
                  fontSize: 11,
                }}
              />
            )}
            <Area
              dataKey="cumulativeCents"
              name="Saved"
              type="monotone"
              stroke={CHART_SERIES}
              strokeWidth={2.5}
              fill={CHART_SERIES_MUTED}
              dot={{ fill: CHART_SERIES, r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function GoalChartTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as SavingsProgressPoint | undefined;
  if (!active || !point) return null;

  return (
    <div className="jar-chart-tooltip">
      <strong>{formatChartDate(point.date)}</strong>
      <dl>
        <div>
          <dt>Saved so far</dt>
          <dd>{formatMoney(point.cumulativeCents)}</dd>
        </div>
      </dl>
    </div>
  );
}

function toTimestamp(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00+08:00`).getTime();
}

function compactMoney(cents: number): string {
  const dollars = cents / 100;
  return dollars >= 1_000 ? `$${(dollars / 1_000).toFixed(1)}k` : `$${dollars}`;
}

function shortDate(value: number): string {
  return new Intl.DateTimeFormat("en-SG", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

function formatChartDate(value: string): string {
  return new Intl.DateTimeFormat("en-SG", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00+08:00`),
  );
}
