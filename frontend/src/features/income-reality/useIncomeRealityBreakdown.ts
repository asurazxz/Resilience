import { useEffect, useState } from "react";
import { fetchIncomeBreakdown } from "./api";
import type { AssumptionsIn, IncomeRealityResponse, WeeklyEntryIn } from "./types";
import { DEFAULT_ASSUMPTIONS } from "./types";

interface UseIncomeRealityBreakdownResult {
  response: IncomeRealityResponse | null;
  loading: boolean;
  error: string | null;
  assumptions: AssumptionsIn;
  setAssumptions: (assumptions: AssumptionsIn) => void;
}

// Fetches the Income Reality breakdown for a caller-supplied list of weekly
// entries, refetching whenever the entries or assumptions change. The
// caller (IncomeRealityPage today; eventually a route in
// frontend/src/app/ once feature/01-foundation-input's manual-entry data
// exists) owns producing `weeks: WeeklyEntryIn[]` - this hook only owns
// talking to the API.
//
// Keys the refetch off a JSON-serialised `weeks` value rather than array
// identity, so callers don't need to memoise the array themselves to avoid
// a refetch loop.
export function useIncomeRealityBreakdown(weeks: WeeklyEntryIn[]): UseIncomeRealityBreakdownResult {
  const [assumptions, setAssumptions] = useState<AssumptionsIn>(DEFAULT_ASSUMPTIONS);
  const [response, setResponse] = useState<IncomeRealityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weeksKey = JSON.stringify(weeks);

  useEffect(() => {
    if (weeks.length === 0) {
      setResponse(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchIncomeBreakdown({ weeks, assumptions })
      .then((result) => {
        if (!cancelled) setResponse(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // weeksKey/assumptions primitives stand in for weeks/assumptions so this
    // doesn't refetch on every render when the caller passes a fresh array
    // or object literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeksKey, assumptions.apply_cpf, assumptions.cpf_rate_bps]);

  return { response, loading, error, assumptions, setAssumptions };
}
