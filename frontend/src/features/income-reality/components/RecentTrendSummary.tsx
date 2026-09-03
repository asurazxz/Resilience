import type { TrendSummaryOut, WeekBreakdownOut } from "../types";
import { formatCents } from "../format";
import { IncomeTrendChart } from "./IncomeTrendChart";

interface RecentTrendSummaryProps {
  trend: TrendSummaryOut;
  weeks: WeekBreakdownOut[];
}

export function RecentTrendSummary({ trend, weeks }: RecentTrendSummaryProps) {
  return (
    <section className="card mt-6" aria-label="Recent income trend">
      <p className="eyebrow">Your recent pattern</p>
      <h2 className="mt-1 subheading">How your weekly income changes</h2>
      <p className="mt-2 max-w-2xl text-sm body-text">
        See what you kept after work costs and what remained after everyday essentials. Hover or tap a week for exact amounts.
      </p>
      <IncomeTrendChart weeks={weeks} />
      <dl className="mt-5 grid gap-3 divider pt-5 sm:grid-cols-3">
        <div className="rounded-xl p-3" style={{ background: "var(--color-obsidian-button)" }}>
          <dt className="mono-label text-xs">Typical week</dt>
          <dd className="mt-1 text-xl font-bold" style={{ color: "var(--color-ivory)" }}>{formatCents(trend.average_net_income_cents)}</dd>
        </div>
        <div className="rounded-xl p-3" style={{ background: "var(--color-obsidian-button)" }}>
          <dt className="mono-label text-xs">Safer amount to plan with</dt>
          <dd className="mt-1 text-xl font-bold" style={{ color: "var(--color-ivory)" }}>{formatCents(trend.conservative_weekly_income_cents)}</dd>
        </div>
        <div className="rounded-xl p-3" style={{ background: "var(--color-obsidian-button)" }}>
          <dt className="mono-label text-xs">Lowest to highest</dt>
          <dd className="mt-1 font-bold" style={{ color: "var(--color-ivory)" }}>{formatCents(trend.min_net_income_cents)} – {formatCents(trend.max_net_income_cents)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs" style={{ color: "var(--color-ash)" }}>Based on {trend.weeks_considered} recorded week{trend.weeks_considered === 1 ? "" : "s"}. The safer amount allows for uneven weeks and never goes below S$0.</p>
    </section>
  );
}
