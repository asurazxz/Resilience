import type {
  ApiErrorBody,
  Contribution,
  ContributionWrite,
  JarSummary,
  PlanPatch,
} from "./types.ts";

const SUMMARY_CACHE_KEY = "resilience.jar.summary.v1";

export interface ResilienceJarApi {
  getSummary(): Promise<JarSummary>;
  patchPlan(patch: PlanPatch): Promise<JarSummary>;
  createContribution(payload: ContributionWrite): Promise<Contribution>;
  createWithdrawal(payload: ContributionWrite): Promise<Contribution>;
  updateContribution(
    contributionId: string,
    payload: Partial<ContributionWrite>,
  ): Promise<Contribution>;
  deleteContribution(contributionId: string): Promise<void>;
}

export class ResilienceJarApiError extends Error {
  readonly body: ApiErrorBody;
  readonly status: number;

  constructor(
    body: ApiErrorBody,
    status: number,
  ) {
    super(body.message);
    this.body = body;
    this.status = status;
  }
}

export class HttpResilienceJarApi implements ResilienceJarApi {
  private readonly baseUrl: string;

  constructor(baseUrl = configuredApiBaseUrl()) {
    this.baseUrl = baseUrl;
  }

  async getSummary(): Promise<JarSummary> {
    const summary = await this.request<JarSummary>("/summary");
    writeCachedSummary(summary);
    return summary;
  }

  async patchPlan(patch: PlanPatch): Promise<JarSummary> {
    const summary = await this.request<JarSummary>("/plan", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    writeCachedSummary(summary);
    return summary;
  }

  createContribution(payload: ContributionWrite): Promise<Contribution> {
    return this.request("/contributions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  createWithdrawal(payload: ContributionWrite): Promise<Contribution> {
    return this.request("/withdrawals", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  updateContribution(
    contributionId: string,
    payload: Partial<ContributionWrite>,
  ): Promise<Contribution> {
    return this.request(`/contributions/${encodeURIComponent(contributionId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteContribution(contributionId: string): Promise<void> {
    await this.request<void>(
      `/contributions/${encodeURIComponent(contributionId)}`,
      { method: "DELETE" },
    );
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/resilience-jar${path}`,
      {
        ...init,
        headers: { "Content-Type": "application/json", ...init.headers },
      },
    );
    if (!response.ok) {
      const fallback: ApiErrorBody = {
        code: "request_failed",
        message: "The emergency fund request could not be completed.",
        field_errors: {},
      };
      let body = fallback;
      try {
        body = (await response.json()) as ApiErrorBody;
      } catch {
        // The fallback is intentionally user-safe when an upstream response is not JSON.
      }
      throw new ResilienceJarApiError(body, response.status);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}

export function readCachedSummary(): JarSummary | null {
  if (typeof window === "undefined") return null;
  const cached = window.localStorage.getItem(SUMMARY_CACHE_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as JarSummary;
  } catch {
    window.localStorage.removeItem(SUMMARY_CACHE_KEY);
    return null;
  }
}

export function writeCachedSummary(summary: JarSummary): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify(summary));
}

function configuredApiBaseUrl(): string {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };
  return (meta.env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
}
