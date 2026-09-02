import { apiRequest } from "../../lib/api";
import type { IncomeRealityRequest, IncomeRealityResponse } from "./types";

export async function fetchIncomeBreakdown(
  request: IncomeRealityRequest,
): Promise<IncomeRealityResponse> {
  return apiRequest<IncomeRealityResponse>("/income-reality/breakdown", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
