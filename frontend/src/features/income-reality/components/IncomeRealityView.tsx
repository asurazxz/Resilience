import type { AssumptionsIn, IncomeRealityResponse } from "../types";
import { IncomeBreakdownCard } from "./IncomeBreakdownCard";
import { RecentTrendSummary } from "./RecentTrendSummary";
import { AssumptionsEditor } from "./AssumptionsEditor";

interface IncomeRealityViewProps {
  assumptions: AssumptionsIn;
  response: IncomeRealityResponse;
  onAssumptionsChange: (assumptions: AssumptionsIn) => void;
}

export function IncomeRealityView({ assumptions, response, onAssumptionsChange }: IncomeRealityViewProps) {
  return (
    <div>
      <AssumptionsEditor
        assumptions={assumptions}
        onChange={onAssumptionsChange}
      />
      <RecentTrendSummary trend={response.trend} weeks={response.weeks} />
      <section className="card mt-6">
        <p className="eyebrow">Week by week</p>
        <h2 className="mt-1 subheading">Recorded weeks</h2>
        <p className="mt-2 text-sm body-text">Start with the amount left. Open any week only when you need the full calculation.</p>
        <div className="mt-3 overflow-x-auto">
        {[...response.weeks].reverse().map((week) => (
          <IncomeBreakdownCard key={week.week_start} week={week} />
        ))}
        </div>
      </section>
    </div>
  );
}
