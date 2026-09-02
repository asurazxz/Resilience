import type { TrendSummaryOut } from "../types";
import { formatCents } from "../format";

interface RecentTrendSummaryProps {
  trend: TrendSummaryOut;
}

// Bare-bones week-to-week trend display. See engine.py::calculate_recent_trend
// for the exact formula behind conservative_weekly_income_cents.
export function RecentTrendSummary({ trend }: RecentTrendSummaryProps) {
  return (
    <section aria-label="Recent income trend">
      <h3>
        Recent income trend ({trend.weeks_considered} week{trend.weeks_considered === 1 ? "" : "s"})
      </h3>
      <ul>
        <li>Average net income: {formatCents(trend.average_net_income_cents)}</li>
        <li>Lowest week: {formatCents(trend.min_net_income_cents)}</li>
        <li>Highest week: {formatCents(trend.max_net_income_cents)}</li>
        <li>Variation (stdev): {formatCents(trend.stdev_net_income_cents)}</li>
        <li>
          <strong>
            Conservative weekly estimate: {formatCents(trend.conservative_weekly_income_cents)}
          </strong>{" "}
          (average minus variation, floored at $0 - a safer number to plan around than the average)
        </li>
      </ul>
    </section>
  );
}
