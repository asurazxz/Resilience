import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setAccessTokenProvider, setUnauthorizedHandler } from "../../lib/api";
import { evaluateAnswers, explainResult } from "./api";
import type { SchemeResult } from "./types";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  setAccessTokenProvider(async () => "token-1");
  setUnauthorizedHandler(null);
});

afterEach(() => {
  setAccessTokenProvider(async () => null);
  setUnauthorizedHandler(null);
  vi.unstubAllGlobals();
});

const sampleResult: SchemeResult = {
  rule_id: "workfare-income-supplement",
  name: "Workfare Income Supplement",
  agency: "CPF Board",
  status: "matched",
  matched_facts: [],
  unmatched_reasons: [],
  missing_fields: [],
  official_source_url: "https://example.gov.sg/wis",
  application_url: "https://example.gov.sg/wis/apply",
  last_reviewed_date: "2026-01-01",
  simplified_note: "A simplified note.",
};

describe("explainResult", () => {
  it("sends rule_id (snake_case), matching the backend ExplanationRequest schema", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        summary: "Plain language summary.",
        next_steps: [],
        source_urls: [],
        is_ai_generated: false,
        generated_at: "2026-01-01T00:00:00Z",
      }),
    );

    await explainResult(sampleResult, { age: 40 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/scheme-navigator/explain");
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ rule_id: "workfare-income-supplement", answers: { age: 40 } });
    // A regression guard: the request must never carry camelCase ruleId,
    // which 422s against the backend's snake_case ExplanationRequest model.
    expect(body).not.toHaveProperty("ruleId");
  });
});

describe("evaluateAnswers", () => {
  it("sends the answers under the EvaluationRequest shape", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { generated_at: "2026-01-01T00:00:00Z", results: [] }),
    );

    await evaluateAnswers({ age: 40 });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ answers: { age: 40 } });
  });
});
