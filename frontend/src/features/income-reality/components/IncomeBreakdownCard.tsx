import type { WeekBreakdownOut } from "../types";
import { formatCents } from "../format";

interface IncomeBreakdownCardProps {
  week: WeekBreakdownOut;
}

export function IncomeBreakdownCard({ week }: IncomeBreakdownCardProps) {
  return (
    <section className="card" aria-label={`Income breakdown for week of ${week.week_start}`}>
      <h3 className="text-xl font-bold">Week of {week.week_start}</h3>
      <ul className="mt-4 space-y-1 text-sm text-slate-600">
        {week.platform_breakdown.map((platform) => (
          <li key={platform.platform}>
            {platform.platform}: {formatCents(platform.gross_cents)}
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm">
        <p className="flex justify-between gap-3"><span>Gross earnings</span><strong>{formatCents(week.gross_earnings_cents)}</strong></p>
        <p className="flex justify-between gap-3"><span>Work costs</span><strong>-{formatCents(week.work_costs_cents)}</strong></p>
        {week.cpf_cents > 0 ? <p className="flex justify-between gap-3"><span>CPF / MediSave</span><strong>-{formatCents(week.cpf_cents)}</strong></p> : null}
        <p className="flex justify-between gap-3"><span>Net work income</span><strong>{formatCents(week.net_income_cents)}</strong></p>
        <p className="flex justify-between gap-3"><span>Essential expenses</span><strong>-{formatCents(week.essential_expenses_cents)}</strong></p>
      </div>
      <p className={`mt-4 rounded-2xl p-3 text-lg ${week.surplus_cents < 0 ? "bg-rose-50 text-rose-900" : "bg-emerald-50 text-emerald-900"}`}>
        <strong>Available surplus: {formatCents(week.surplus_cents)}</strong>
        {week.surplus_cents < 0 ? " (deficit)" : null}
      </p>
    </section>
  );
}
