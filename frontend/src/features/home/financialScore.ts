import { useEffect, useRef, useState } from "react";

import { apiRequest } from "../../lib/api";

export type FinancialScoreBand = "building" | "steady" | "strong" | "resilient" | "unknown";

export type FinancialScoreComponentId = "emergency_fund" | "savings_habit" | "cash_flow";

export type FinancialScoreComponentStatus = "scored" | "not_enough_information";

export interface FinancialScoreComponent {
  id: FinancialScoreComponentId;
  label: string;
  status: FinancialScoreComponentStatus;
  points: number;
  maxPoints: number;
  detail: string;
}

export interface FinancialScoreMissingInput {
  id: string;
  label: string;
  action: string;
  route: string;
}

export interface FinancialScore {
  score: number | null;
  band: FinancialScoreBand;
  generatedAt: string;
  scoredMaxPoints: number;
  components: FinancialScoreComponent[];
  nextStep: string | null;
  /** What the user must add before every component can score. Always present on the API; defaults to [] here in case an older response omits it. */
  missingInputs: FinancialScoreMissingInput[];
}

/** The tab each score component concerns, for the card's "go fix this" link. */
export const FINANCIAL_SCORE_COMPONENT_LINKS: Record<FinancialScoreComponentId, string> = {
  emergency_fund: "/resilience-jar",
  savings_habit: "/savings",
  cash_flow: "/income-reality",
};

export const fetchFinancialScore = () =>
  apiRequest<FinancialScore>("/financial-score").then((score) => ({
    ...score,
    missingInputs: score.missingInputs ?? [],
  }));

export interface FinancialScoreState {
  score: FinancialScore | null;
  loading: boolean;
  /** True once the fetch has failed; the score card should still render around it. */
  failed: boolean;
}

/**
 * Fetches the score once on mount, and again whenever `refetchKey` changes.
 * Pass a primitive (or a stable, joined string of primitives) built only
 * from data that actually changes when the user's foundation data does —
 * e.g. transaction count, emergency fund balance, or onboarding status.
 * Never key off a server-generated timestamp such as bootstrap `syncedAt`:
 * it changes on every bootstrap response even when nothing the user owns
 * has changed, which causes redundant refetches. Failure never throws into
 * the caller; stale in-flight responses are ignored so they can never
 * overwrite a newer, still-loading request's result.
 */
export function useFinancialScore(refetchKey?: unknown): FinancialScoreState {
  const [state, setState] = useState<FinancialScoreState>({ score: null, loading: true, failed: false });
  // Bumped on every effect run so an in-flight response can tell whether it
  // is still the most recent request. A fast key change (or StrictMode's
  // double-invoke) can leave an older request in flight after a newer one
  // has started; without this, the older response could resolve second and
  // overwrite the newer, correct one.
  const latestRequestSeq = useRef(0);

  useEffect(() => {
    let active = true;
    const requestSeq = ++latestRequestSeq.current;
    const isStale = () => !active || requestSeq !== latestRequestSeq.current;
    setState((previous) => ({ ...previous, loading: true }));
    fetchFinancialScore()
      .then((score) => { if (!isStale()) setState({ score, loading: false, failed: false }); })
      .catch(() => { if (!isStale()) setState({ score: null, loading: false, failed: true }); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchKey]);

  return state;
}
