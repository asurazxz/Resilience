import type { WeekBreakdownOut } from "../types";
import { formatCents } from "../format";

interface IncomeBreakdownCardProps {
  week: WeekBreakdownOut;
}

export function IncomeBreakdownCard({ week }: IncomeBreakdownCardProps) {
  return (
    <details className="group border-b border-slate-200" aria-label={`Income breakdown for week of ${week.week_start}`}>
      <summary className="grid cursor-pointer list-none items-center gap-3 py-4 sm:grid-cols-[1fr_auto_auto]">
        <span>
          <strong className="block">Week of {week.week_start}</strong>
          <span className="text-xs text-slate-500">Tap for the full breakdown</span>
        </span>
        <span className="text-sm text-slate-600">
          Left after essentials: <strong className={week.surplus_cents < 0 ? "text-rose-700" : "text-emerald-700"}>{formatCents(week.surplus_cents)}</strong>
        </span>
        <span className="text-sm font-bold text-indigo-700 group-open:rotate-180" aria-hidden="true">⌄</span>
      </summary>
      <div className="pb-5 pl-0 sm:pl-4">
      <ul className="space-y-1 text-sm text-slate-600">
        {week.platform_breakdown.map((platform) => (
          <li key={platform.platform}>
            {platform.platform}: {formatCents(platform.gross_cents)}
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm">
        <p className="flex justify-between gap-3"><span>Total earnings</span><strong>{formatCents(week.gross_earnings_cents)}</strong></p>
        <p className="flex justify-between gap-3"><span>Costs needed for work</span><strong>-{formatCents(week.work_costs_cents)}</strong></p>
        {week.cpf_cents > 0 ? <p className="flex justify-between gap-3"><span>CPF / MediSave</span><strong>-{formatCents(week.cpf_cents)}</strong></p> : null}
        <p className="flex justify-between gap-3"><span>Income after work costs</span><strong>{formatCents(week.net_income_cents)}</strong></p>
        <p className="flex justify-between gap-3"><span>Everyday essentials</span><strong>-{formatCents(week.essential_expenses_cents)}</strong></p>
      </div>
      <p className={`mt-4 rounded-2xl p-3 text-lg ${week.surplus_cents < 0 ? "bg-rose-50 text-rose-900" : "bg-emerald-50 text-emerald-900"}`}>
        <strong>{week.surplus_cents < 0 ? "Amount short" : "Money left"}: {formatCents(week.surplus_cents)}</strong>
      </p>
      </div>
    </details>
  );
}
