import type {
  Contribution,
  ContributionWrite,
  JarSummary,
  PlanPatch,
} from "./types.ts";
import { apiRequest } from "../../lib/api";

export interface ResilienceJarApi {
  getSummary(): Promise<JarSummary>;
  patchPlan(patch: PlanPatch): Promise<JarSummary>;
  setOpeningBalance(amountCents: number): Promise<JarSummary>;
  createContribution(payload: ContributionWrite): Promise<Contribution>;
  createWithdrawal(payload: ContributionWrite): Promise<Contribution>;
  updateContribution(
    contributionId: string,
    payload: Partial<ContributionWrite>,
  ): Promise<Contribution>;
  deleteContribution(contributionId: string): Promise<void>;
}

// Jar payloads stay snake_case: they are passed straight through to the API.
const jarPath = (path: string) => `/resilience-jar${path}`;

export class HttpResilienceJarApi implements ResilienceJarApi {
  async getSummary(): Promise<JarSummary> {
    const summary = await apiRequest<JarSummary>(jarPath("/summary"));
    writeCachedSummary(summary);
    return summary;
  }

  async patchPlan(patch: PlanPatch): Promise<JarSummary> {
    const summary = await apiRequest<JarSummary>(jarPath("/plan"), {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    writeCachedSummary(summary);
    return summary;
  }

  async setOpeningBalance(amountCents: number): Promise<JarSummary> {
    const summary = await apiRequest<JarSummary>(jarPath("/opening-balance"), {
      method: "PUT",
      body: JSON.stringify({ amount_cents: amountCents }),
    });
    writeCachedSummary(summary);
    return summary;
  }

  createContribution(payload: ContributionWrite): Promise<Contribution> {
    return apiRequest<Contribution>(jarPath("/contributions"), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  createWithdrawal(payload: ContributionWrite): Promise<Contribution> {
    return apiRequest<Contribution>(jarPath("/withdrawals"), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  updateContribution(
    contributionId: string,
    payload: Partial<ContributionWrite>,
  ): Promise<Contribution> {
    return apiRequest<Contribution>(
      jarPath(`/contributions/${encodeURIComponent(contributionId)}`),
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  }

  async deleteContribution(contributionId: string): Promise<void> {
    await apiRequest<void>(
      jarPath(`/contributions/${encodeURIComponent(contributionId)}`),
      { method: "DELETE" },
    );
  }
}

export function readCachedSummary(): JarSummary | null {
  // Emergency-fund data is sensitive. It is intentionally not persisted in a
  // browser-global cache where a later account could read another user's balance.
  return null;
}

export function writeCachedSummary(_summary: JarSummary): void {
  // See readCachedSummary: authenticated server data remains the source of truth.
}
