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
  const { response, loading, error, setAssumptions } = useIncomeRealityBreakdown(weeks);

  if (weeks.length === 0) {
    return <p>No weekly entries yet. Record a week to see your Income Reality breakdown.</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Could not load Income Reality: {error}</p>;
  }

  if (loading && !response) {
    return <p>Loading...</p>;
  }

  if (!response) {
    return null;
  }

  return <IncomeRealityView response={response} onAssumptionsChange={setAssumptions} />;
}
