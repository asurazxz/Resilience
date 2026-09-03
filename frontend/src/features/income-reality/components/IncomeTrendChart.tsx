import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCents } from "../format";
import type { WeekBreakdownOut } from "../types";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_SERIES,
  CHART_SERIES_MUTED,
  CHART_SURFACE,
} from "../../../lib/chartTheme";

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short" }).format(
    new Date(`${value}T00:00:00+08:00`),
  );
}

function axisMoney(cents: number) {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000) return `$${Math.round(dollars / 1_000)}k`;
  return `$${Math.round(dollars)}`;
}

function TrendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const values = new Map(payload.map((item) => [item.dataKey, item.value ?? 0]));
  return (
    <div
      className="rounded-xl p-3 text-sm"
      style={{ background: CHART_SURFACE, border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-ivory)" }}
    >
      <p className="font-bold" style={{ color: "var(--color-ivory)" }}>Week of {label}</p>
      <p className="mt-2 flex justify-between gap-5" style={{ color: "var(--color-ash)" }}>
        <span>After work costs</span>
        <strong style={{ color: "var(--color-ivory)" }}>{formatCents(values.get("takeHome") ?? 0)}</strong>
      </p>
      <p className="mt-1 flex justify-between gap-5" style={{ color: "var(--color-ash)" }}>
        <span>Left after essentials</span>
        <strong style={{ color: "var(--color-ivory)" }}>{formatCents(values.get("moneyLeft") ?? 0)}</strong>
      </p>
    </div>
  );
}

export function IncomeTrendChart({ weeks }: { weeks: WeekBreakdownOut[] }) {
  const data = [...weeks]
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .map((week) => ({
      date: shortDate(week.week_start),
      takeHome: week.net_income_cents,
      moneyLeft: week.surplus_cents,
    }));

  return (
    <figure className="mt-5" aria-labelledby="income-chart-caption">
      <div className="h-72 w-full overflow-x-auto" aria-label="Weekly income and money left trend chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: CHART_AXIS }} tickLine={false} axisLine={{ stroke: CHART_AXIS }} />
            <YAxis
              tickFormatter={axisMoney}
              tick={{ fontSize: 12, fill: CHART_AXIS }}
              tickLine={false}
              axisLine={{ stroke: CHART_AXIS }}
              width={52}
            />
            <Tooltip content={<TrendTooltip />} />
            <ReferenceLine y={0} stroke={CHART_AXIS} />
            <Bar dataKey="moneyLeft" name="Left after essentials" fill={CHART_SERIES_MUTED} radius={[5, 5, 0, 0]} />
            <Line
              dataKey="takeHome"
              name="After work costs"
              type="monotone"
              stroke={CHART_SERIES}
              strokeWidth={3}
              dot={{ fill: CHART_SERIES, r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption id="income-chart-caption" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: "var(--color-ash)" }}>
        <span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CHART_SERIES_MUTED }} />Bars show money left after essentials</span>
        <span><span className="mr-2 inline-block h-0.5 w-4 align-middle" style={{ background: CHART_SERIES }} />Line shows income after work costs</span>
      </figcaption>
    </figure>
  );
}
