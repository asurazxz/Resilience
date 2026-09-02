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
      <RecentTrendSummary trend={response.trend} />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[...response.weeks].reverse().map((week) => (
          <IncomeBreakdownCard key={week.week_start} week={week} />
        ))}
      </div>
    </div>
  );
}
