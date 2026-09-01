// Not runnable until feature/01-foundation-input's Vite/package.json setup
// lands (import.meta.env typing needs its vite-env.d.ts). Written against
// contracts/fixtures/income-reality for development in the meantime.

import type { IncomeRealityRequest, IncomeRealityResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function fetchIncomeBreakdown(
  request: IncomeRealityRequest,
): Promise<IncomeRealityResponse> {
  const response = await fetch(`${API_BASE_URL}/income-reality/breakdown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Income Reality request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as IncomeRealityResponse;
}
