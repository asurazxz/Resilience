import type { WeekBreakdownOut } from "../types";
import { formatCents } from "../format";

interface IncomeBreakdownCardProps {
  week: WeekBreakdownOut;
}

export function IncomeBreakdownCard({ week }: IncomeBreakdownCardProps) {
  const isShort = week.surplus_cents < 0;

  return (
    <details className="group divider" aria-label={`Income breakdown for week of ${week.week_start}`}>
      <summary className="grid cursor-pointer list-none items-center gap-3 py-4 sm:grid-cols-[1fr_auto_auto]">
        <span>
          <strong className="block" style={{ color: "var(--color-ivory)" }}>Week of {week.week_start}</strong>
          <span className="mono-label text-xs" style={{ color: "var(--color-ash)" }}>Tap for the full breakdown</span>
        </span>
        <span className="text-sm body-text">
          Left after essentials: <strong style={{ color: "var(--color-ivory)" }}>{isShort ? "-" : "+"}{formatCents(Math.abs(week.surplus_cents))}</strong>
        </span>
        <span className="text-sm font-bold group-open:rotate-180" style={{ color: "var(--color-ivory)" }} aria-hidden="true">⌄</span>
      </summary>
      <div className="pb-5 pl-0 sm:pl-4">
      <ul className="space-y-1 text-sm body-text">
        {week.platform_breakdown.map((platform) => (
          <li key={platform.platform}>
            {platform.platform}: {formatCents(platform.gross_cents)}
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-2 divider pt-4 text-sm">
        <p className="flex justify-between gap-3"><span>Total earnings</span><strong>{formatCents(week.gross_earnings_cents)}</strong></p>
        <p className="flex justify-between gap-3"><span>Costs needed for work</span><strong>-{formatCents(week.work_costs_cents)}</strong></p>
        {week.cpf_cents > 0 ? <p className="flex justify-between gap-3"><span>CPF / MediSave</span><strong>-{formatCents(week.cpf_cents)}</strong></p> : null}
        <p className="flex justify-between gap-3"><span>Income after work costs</span><strong>{formatCents(week.net_income_cents)}</strong></p>
        <p className="flex justify-between gap-3"><span>Everyday essentials</span><strong>-{formatCents(week.essential_expenses_cents)}</strong></p>
      </div>
      <p className="mt-4 rounded-2xl p-3 text-lg" style={{ background: "var(--color-obsidian-button)", color: "var(--color-ivory)" }}>
        <span className="mono-label block mb-1">{isShort ? "Shortfall" : "Surplus"}</span>
        <strong>{isShort ? "-" : "+"}{formatCents(Math.abs(week.surplus_cents))}</strong>
      </p>
      </div>
    </details>
  );
}
