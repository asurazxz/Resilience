import type { AssumptionsIn, IncomeRealityResponse } from "../types";
import { IncomeBreakdownCard } from "./IncomeBreakdownCard";
import { RecentTrendSummary } from "./RecentTrendSummary";
import { AssumptionsEditor } from "./AssumptionsEditor";

interface IncomeRealityViewProps {
  response: IncomeRealityResponse;
  onAssumptionsChange?: (assumptions: AssumptionsIn) => void;
}

// Bare-bones assembly of the Income Reality UI pieces - deliberately no
// visual design pass this round. A caller (a page in app/, or a manual
// harness) supplies already-fetched data; see api.ts for the live fetch and
// contracts/fixtures/income-reality for example data to develop against
// before the backend is mounted.
export function IncomeRealityView({ response, onAssumptionsChange }: IncomeRealityViewProps) {
  return (
    <div>
      <h2>Income Reality</h2>
      <AssumptionsEditor
        assumptions={response.assumptions_applied}
        onChange={onAssumptionsChange ?? (() => {})}
      />
      {response.weeks.map((week) => (
        <IncomeBreakdownCard key={week.week_start} week={week} />
      ))}
      <RecentTrendSummary trend={response.trend} />
    </div>
  );
}
