import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import {
  buildBalanceTimeline,
  formatMoney,
  type BalanceChartPoint,
} from "./model.ts";
import type { Contribution } from "./types.ts";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_SERIES,
  CHART_TEXT,
} from "../../lib/chartTheme";

interface ProgressLineChartProps {
  contributions: Contribution[];
  goalTargetCents: number | null;
}

export function ProgressLineChart({
  contributions,
  goalTargetCents,
}: ProgressLineChartProps) {
  const points = buildBalanceTimeline(contributions);

  if (points.length === 0) {
    return <p className="jar-muted">Add a contribution to start the progress chart.</p>;
  }

  return (
    <figure className="jar-chart" aria-labelledby="jar-chart-title">
      <figcaption id="jar-chart-title">
        Emergency fund balance over time
      </figcaption>
      <p className="jar-muted">
        Contributions move the line up; emergency withdrawals move it down.
      </p>
      <div className="jar-chart-canvas">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart
            data={points}
            margin={{ top: 18, right: 18, bottom: 4, left: 4 }}
            accessibilityLayer
          >
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              stroke={CHART_AXIS}
              tick={{ fontSize: 12, fill: CHART_TEXT }}
            />
            <YAxis
              stroke={CHART_AXIS}
              tick={{ fontSize: 12, fill: CHART_TEXT }}
              tickFormatter={compactMoney}
              width={62}
            />
            <Tooltip content={BalanceTooltip} />
            {goalTargetCents !== null && (
              <ReferenceLine
                y={goalTargetCents}
                stroke={CHART_TEXT}
                strokeDasharray="6 4"
                label={{ value: "Goal", fill: CHART_TEXT, position: "insideTopRight" }}
              />
            )}
            <Line
              dataKey="balance_cents"
              name="Emergency fund balance"
              type="monotone"
              stroke={CHART_SERIES}
              strokeWidth={3}
              dot={{ fill: CHART_SERIES, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function BalanceTooltip({
  active,
  payload,
}: TooltipContentProps) {
  const point = payload?.[0]?.payload as BalanceChartPoint | undefined;
  if (!active || !point) return null;

  return (
    <div className="jar-chart-tooltip">
      <strong>{formatChartDate(point.date)}</strong>
      <dl>
        <div>
          <dt>Contributions</dt>
          <dd className="jar-tooltip-contribution">
            +{formatMoney(point.contribution_cents)}
          </dd>
        </div>
        <div>
          <dt>Withdrawals</dt>
          <dd className="jar-tooltip-withdrawal">
            −{formatMoney(point.withdrawal_cents)}
          </dd>
        </div>
        <div className="jar-tooltip-balance">
          <dt>Closing balance</dt>
          <dd>{formatMoney(point.balance_cents)}</dd>
        </div>
      </dl>
    </div>
  );
}

function compactMoney(cents: number): string {
  const dollars = cents / 100;
  return dollars >= 1_000 ? `$${(dollars / 1_000).toFixed(1)}k` : `$${dollars}`;
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("en-SG", { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00+08:00`),
  );
}

function formatChartDate(value: string): string {
  return new Intl.DateTimeFormat("en-SG", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00+08:00`),
  );
}
