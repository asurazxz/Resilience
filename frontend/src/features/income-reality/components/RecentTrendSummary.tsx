import type { TrendSummaryOut } from "../types";
import { formatCents } from "../format";

interface RecentTrendSummaryProps {
  trend: TrendSummaryOut;
}

export function RecentTrendSummary({ trend }: RecentTrendSummaryProps) {
  return (
    <section className="card mt-6" aria-label="Recent income trend">
      <h3 className="text-xl font-bold">
        Recent income trend ({trend.weeks_considered} week{trend.weeks_considered === 1 ? "" : "s"})
      </h3>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li>Average net income: {formatCents(trend.average_net_income_cents)}</li>
        <li>Lowest week: {formatCents(trend.min_net_income_cents)}</li>
        <li>Highest week: {formatCents(trend.max_net_income_cents)}</li>
        <li>Variation (stdev): {formatCents(trend.stdev_net_income_cents)}</li>
        <li className="rounded-2xl bg-indigo-50 p-4 sm:col-span-2 lg:col-span-4">
          <strong>
            Conservative weekly estimate: {formatCents(trend.conservative_weekly_income_cents)}
          </strong>{" "}
          (average minus variation, floored at $0 - a safer number to plan around than the average)
        </li>
      </ul>
    </section>
  );
}
