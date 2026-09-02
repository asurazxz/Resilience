import { useIncomeRealityBreakdown } from "./useIncomeRealityBreakdown";
import { IncomeRealityView } from "./components/IncomeRealityView";
import type { WeeklyEntryIn } from "./types";

interface IncomeRealityPageProps {
  weeks: WeeklyEntryIn[];
}

// The integration seam for feature/01-foundation-input: whoever builds the
// app route/navigation in frontend/src/app/ renders
// <IncomeRealityPage weeks={...} /> with the user's weekly entries, in the
// shape defined by types.ts::WeeklyEntryIn (mirrors
// contracts/schemas/income-reality.schema.json). This component owns
// fetching and displaying the breakdown; it does not know or care where
// `weeks` came from - manual entry, a saved draft, CSV import, etc.
//
// If Workstream 1's persisted entry shape ends up different from
// WeeklyEntryIn, the fix is a small mapping function at the call site
// (grouping by week, one PlatformEarning per platform) - this component
// and useIncomeRealityBreakdown should not need to change.
export function IncomeRealityPage({ weeks }: IncomeRealityPageProps) {
  const { response, loading, error, assumptions, setAssumptions } = useIncomeRealityBreakdown(weeks);

  if (weeks.length === 0) {
    return (
      <div className="card mt-6 text-slate-600">
        No confirmed weekly entries yet. Record a week to see your Income Reality breakdown.
      </div>
    );
  }

  if (error) {
    return (
      <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-rose-800" role="alert">
        Could not load Income Reality: {error}
      </p>
    );
  }

  if (loading && !response) {
    return <p className="card mt-6 text-slate-600" role="status">Calculating your income reality…</p>;
  }

  if (!response) {
    return null;
  }

  return (
    <div className={loading ? "opacity-70 transition-opacity" : "transition-opacity"}>
      <IncomeRealityView
        assumptions={assumptions}
        response={response}
        onAssumptionsChange={setAssumptions}
      />
    </div>
  );
}
