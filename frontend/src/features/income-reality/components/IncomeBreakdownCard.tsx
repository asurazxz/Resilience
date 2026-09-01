import type { WeekBreakdownOut } from "../types";
import { formatCents } from "../format";

interface IncomeBreakdownCardProps {
  week: WeekBreakdownOut;
}

// Bare-bones display only - no visual design pass yet (see .agent/RULES.md:
// discard pristine UI work unless required for correctness, privacy, or
// safety). Every line here maps directly to a WeekBreakdownOut field so the
// value stays traceable to the underlying formula.
export function IncomeBreakdownCard({ week }: IncomeBreakdownCardProps) {
  return (
    <section aria-label={`Income breakdown for week of ${week.week_start}`}>
      <h3>Week of {week.week_start}</h3>
      <ul>
        {week.platform_breakdown.map((platform) => (
          <li key={platform.platform}>
            {platform.platform}: {formatCents(platform.gross_cents)}
          </li>
        ))}
      </ul>
      <p>Gross earnings: {formatCents(week.gross_earnings_cents)}</p>
      <p>Work costs: -{formatCents(week.work_costs_cents)}</p>
      {week.cpf_cents > 0 && <p>CPF (estimate): -{formatCents(week.cpf_cents)}</p>}
      <p>
        <strong>Net income: {formatCents(week.net_income_cents)}</strong>
      </p>
      <p>Essential expenses: -{formatCents(week.essential_expenses_cents)}</p>
      <p>
        <strong>Surplus: {formatCents(week.surplus_cents)}</strong>
        {week.surplus_cents < 0 ? " (deficit)" : null}
      </p>
    </section>
  );
}
