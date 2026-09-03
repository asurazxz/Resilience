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

import { CHART_AXIS, CHART_GRID, CHART_SERIES, CHART_SERIES_MUTED, CHART_SURFACE, CHART_TEXT } from "../../lib/chartTheme";
import { formatMoney } from "../../lib/money";
import type { WeeklyEntryIn } from "../income-reality/types";

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

function weekIncome(week: WeeklyEntryIn): number {
  return week.platform_earnings.reduce((total, item) => total + item.gross_cents, 0);
}

function weekCosts(week: WeeklyEntryIn): number {
  return week.work_costs_cents + week.essential_expenses_cents;
}

function TrendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const values = new Map(payload.map((item) => [item.dataKey, item.value ?? 0]));
  return (
    <div className="rounded-lg p-3 text-sm" style={{ background: CHART_SURFACE, border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="body-text ink-heading">Week of {label}</p>
      <p className="mt-2 flex justify-between gap-5 body-text">
        <span>Income</span>
        <strong className="ink-key">{formatMoney(values.get("income") ?? 0)}</strong>
      </p>
      <p className="mt-1 flex justify-between gap-5 body-text">
        <span>Costs</span>
        <strong className="ink-key">{formatMoney(values.get("costs") ?? 0)}</strong>
      </p>
    </div>
  );
}

/** Last 8 recorded weeks of income vs. costs, derived from adaptTransactions output. */
export function WeeklyTrendChart({ weeks }: { weeks: WeeklyEntryIn[] }) {
  const recent = [...weeks].sort((a, b) => a.week_start.localeCompare(b.week_start)).slice(-8);

  if (recent.length < 2) {
    return (
      <section className="card">
        <p className="eyebrow">Weekly trend</p>
        <p className="mt-3 body-text prose">
          Record income and costs across at least two weeks to see a trend here.
        </p>
      </section>
    );
  }

  const data = recent.map((week) => ({
    date: shortDate(week.week_start),
    income: weekIncome(week),
    costs: weekCosts(week),
  }));

  return (
    <section className="card">
      <p className="eyebrow">Weekly trend</p>
      <h2 className="mt-2 display-lg" style={{ fontSize: "22px" }}>Income and costs, last {recent.length} weeks</h2>
      <figure className="mt-6" style={{ overflowX: "auto" }}>
        <div className="h-72 w-full min-w-[420px]" aria-label="Weekly income and costs trend chart">
          <ResponsiveContainer height="100%" minHeight={1} minWidth={1} width="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke={CHART_AXIS} tick={{ fontSize: 12, fill: CHART_TEXT }} tickLine={false} />
              <YAxis stroke={CHART_AXIS} tick={{ fontSize: 12, fill: CHART_TEXT }} tickFormatter={axisMoney} tickLine={false} width={52} />
              <Tooltip content={<TrendTooltip />} />
              <ReferenceLine stroke={CHART_AXIS} y={0} />
              <Bar dataKey="costs" fill={CHART_SERIES_MUTED} name="Costs" radius={[5, 5, 0, 0]} />
              <Line
                dataKey="income"
                dot={{ fill: CHART_SERIES, r: 3 }}
                name="Income"
                stroke={CHART_SERIES}
                strokeWidth={3}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <figcaption className="mt-6 flex flex-wrap gap-x-6 gap-y-3 mono-label" style={{ letterSpacing: "0.05em" }}>
          <span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CHART_SERIES_MUTED }} />Bars show weekly costs</span>
          <span><span className="mr-2 inline-block h-0.5 w-4 align-middle" style={{ background: CHART_SERIES }} />Line shows weekly income</span>
        </figcaption>
      </figure>
    </section>
  );
}
