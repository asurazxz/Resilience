import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { formatMoney } from "../../lib/money";
import { HttpSavingsApi } from "../savings/api";
import type { SavingsGoal } from "../savings/types";

function FigureCard({ to, label, value, detail }: { to: string; label: string; value: string; detail: string }) {
  return (
    <Link className="card block no-underline" to={to}>
      <p className="mono-label">{label}</p>
      <p className="mt-3 display-lg ink-key" style={{ fontSize: "32px" }}>{value}</p>
      <p className="mt-3 body-text">{detail}</p>
    </Link>
  );
}

/** Active count and total saved across the user's savings goals. */
function useSavingsSummary(): { loading: boolean; activeCount: number; savedCents: number } {
  const [goals, setGoals] = useState<SavingsGoal[] | null>(null);

  useEffect(() => {
    let active = true;
    new HttpSavingsApi()
      .listGoals()
      .then((result) => { if (active) setGoals(result); })
      .catch(() => { if (active) setGoals([]); });
    return () => { active = false; };
  }, []);

  if (goals === null) return { loading: true, activeCount: 0, savedCents: 0 };
  const activeGoals = goals.filter((goal) => goal.status === "active");
  return {
    loading: false,
    activeCount: activeGoals.length,
    savedCents: goals.reduce((total, goal) => total + goal.savedCents, 0),
  };
}

export function KeyFigures({
  emergencyFundBalanceCents,
  weeksCovered,
  averageWeeklyLeftoverCents,
  weeksRecorded,
}: {
  emergencyFundBalanceCents: number;
  weeksCovered: number | null;
  averageWeeklyLeftoverCents: number | null;
  weeksRecorded: number;
}) {
  const savings = useSavingsSummary();

  return (
    <section className="grid gap-6 md:grid-cols-3">
      <FigureCard
        detail={weeksCovered !== null ? `Covers about ${weeksCovered} week${weeksCovered === 1 ? "" : "s"} of essentials` : "—"}
        label="Emergency fund"
        to="/resilience-jar"
        value={formatMoney(emergencyFundBalanceCents)}
      />
      <FigureCard
        detail={
          weeksRecorded > 0
            ? `Income minus work costs and essentials, averaged over the last ${weeksRecorded} recorded week${weeksRecorded === 1 ? "" : "s"}`
            : "No recorded weeks yet"
        }
        label="Average left after costs"
        to="/income-reality"
        value={averageWeeklyLeftoverCents !== null ? formatMoney(averageWeeklyLeftoverCents) : "—"}
      />
      <FigureCard
        detail={savings.loading ? "Loading…" : `${formatMoney(savings.savedCents)} saved`}
        label="Savings goals"
        to="/savings"
        value={savings.loading ? "—" : `${savings.activeCount} active`}
      />
    </section>
  );
}
