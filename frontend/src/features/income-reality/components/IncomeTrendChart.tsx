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
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
      <p className="font-bold">Week of {label}</p>
      <p className="mt-2 flex justify-between gap-5 text-slate-600">
        <span>After work costs</span>
        <strong className="text-slate-900">{formatCents(values.get("takeHome") ?? 0)}</strong>
      </p>
      <p className="mt-1 flex justify-between gap-5 text-slate-600">
        <span>Left after essentials</span>
        <strong className="text-slate-900">{formatCents(values.get("moneyLeft") ?? 0)}</strong>
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
      <div className="h-72 w-full" aria-label="Weekly income and money left trend chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis tickFormatter={axisMoney} tick={{ fontSize: 12 }} tickLine={false} width={52} />
            <Tooltip content={<TrendTooltip />} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="moneyLeft" name="Left after essentials" fill="#a7f3d0" radius={[5, 5, 0, 0]} />
            <Line
              dataKey="takeHome"
              name="After work costs"
              type="monotone"
              stroke="#4338ca"
              strokeWidth={3}
              dot={{ fill: "#4338ca", r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption id="income-chart-caption" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
        <span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-200" />Bars show money left after essentials</span>
        <span><span className="mr-2 inline-block h-0.5 w-4 align-middle bg-indigo-700" />Line shows income after work costs</span>
      </figcaption>
    </figure>
  );
}
