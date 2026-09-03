import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFinancialScore, type FinancialScore } from "./financialScore";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  apiRequest: apiRequestMock,
}));

function makeScore(overrides: Partial<FinancialScore> = {}): FinancialScore {
  return {
    score: 100,
    band: "steady",
    generatedAt: "2026-01-01T00:00:00Z",
    scoredMaxPoints: 100,
    components: [],
    nextStep: null,
    missingInputs: [],
    ...overrides,
  };
}

describe("useFinancialScore", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("does not refetch when only a server timestamp changes but the user's data has not", async () => {
    apiRequestMock.mockResolvedValue(makeScore());

    // Mirrors keying off stable, data-derived facts (e.g. "3 transactions")
    // rather than a server-generated timestamp like bootstrap `syncedAt`,
    // which changes on every bootstrap response regardless of user data.
    const { rerender } = renderHook(({ key }) => useFinancialScore(key), {
      initialProps: { key: "3" },
    });

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledTimes(1));

    // A refresh that only bumps a server timestamp must not change the key.
    rerender({ key: "3" });
    rerender({ key: "3" });

    // Give any accidental extra effect a chance to fire before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
  });

  it("refetches when the user's underlying data genuinely changes (e.g. a new transaction)", async () => {
    apiRequestMock.mockResolvedValue(makeScore());

    const { rerender } = renderHook(({ key }) => useFinancialScore(key), {
      initialProps: { key: "3" },
    });

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledTimes(1));

    rerender({ key: "4" });

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledTimes(2));
  });

  it("never lets a stale in-flight response overwrite a newer one", async () => {
    let resolveFirst: (score: FinancialScore) => void;
    let resolveSecond: (score: FinancialScore) => void;
    const firstPromise = new Promise<FinancialScore>((resolve) => { resolveFirst = resolve; });
    const secondPromise = new Promise<FinancialScore>((resolve) => { resolveSecond = resolve; });

    apiRequestMock
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => secondPromise);

    const { result, rerender } = renderHook(({ key }) => useFinancialScore(key), {
      initialProps: { key: "old-key" },
    });

    // Trigger the second request before the first resolves.
    rerender({ key: "new-key" });

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledTimes(2));

    // Resolve the newer request first, then the stale older one -- the
    // stale response arriving last must not clobber the newer result.
    resolveSecond!(makeScore({ score: 42 }));
    await waitFor(() => expect(result.current.score?.score).toBe(42));

    resolveFirst!(makeScore({ score: 1 }));
    // Give the stale resolution a chance to (incorrectly) apply.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.score?.score).toBe(42);
    expect(result.current.loading).toBe(false);
  });
});
