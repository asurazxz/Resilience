import { Link } from "react-router-dom";

import { formatMoney } from "../../lib/money";
import type { WeeklyEntryIn } from "../income-reality/types";

/** Monday (UTC) of the week containing `isoDate`, matching adaptTransactions' own grouping. */
function mondayOf(isoDate: string): string {
  const occurred = new Date(`${isoDate}T00:00:00Z`);
  const monday = new Date(occurred);
  monday.setUTCDate(occurred.getUTCDate() - ((occurred.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function weekIncome(week: WeeklyEntryIn): number {
  return week.platform_earnings.reduce((total, item) => total + item.gross_cents, 0);
}

/**
 * The current, still-open Monday-to-Sunday week: money in, money out, and
 * what remains so far. Built from the same `adaptTransactions` output as the
 * rest of the app, so it reflects ranged transactions exactly as everywhere
 * else — it just picks out the week containing today instead of a completed one.
 */
export function CurrentWeekCard({ weeks, today = new Date().toISOString().slice(0, 10) }: { weeks: WeeklyEntryIn[]; today?: string }) {
  const weekStart = mondayOf(today);
  const week = weeks.find((item) => item.week_start === weekStart);

  const weekEnd = (() => {
    const end = new Date(`${weekStart}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 6);
    return end.toISOString().slice(0, 10);
  })();

  return (
    <section className="card">
      <p className="eyebrow">This week so far · {weekStart} to {weekEnd}</p>
      <h2 className="mt-2 display-lg" style={{ fontSize: "22px" }}>Week in progress</h2>
      {!week ? (
        <p className="mt-3 body-text prose">
          No entries yet for this week. Add a transaction to see money in, money out, and what remains as you go.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="mono-label">Money in</p>
            <p className="mt-2 display-lg ink-key" style={{ fontSize: "24px" }}>+{formatMoney(weekIncome(week))}</p>
          </div>
          <div>
            <p className="mono-label">Money out</p>
            <p className="mt-2 display-lg ink-key" style={{ fontSize: "24px" }}>
              −{formatMoney(week.work_costs_cents + week.essential_expenses_cents)}
            </p>
          </div>
          <div>
            <p className="mono-label">Left so far</p>
            <p className="mt-2 display-lg ink-key" style={{ fontSize: "24px" }}>
              {formatMoney(weekIncome(week) - week.work_costs_cents - week.essential_expenses_cents)}
            </p>
          </div>
        </div>
      )}
      <Link className="button-secondary mt-6 inline-flex" to="/transactions/new">Add transaction</Link>
    </section>
  );
}
