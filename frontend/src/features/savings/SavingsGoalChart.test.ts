import { describe, expect, it } from "vitest";

import { buildSavingsProgressSeries } from "./SavingsGoalChart";
import type { SavingsContribution } from "./types";

function makeContribution(
  overrides: Partial<SavingsContribution> = {},
): SavingsContribution {
  return {
    id: "c1",
    amountCents: 1_000,
    contributedOn: "2026-01-01",
    note: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("buildSavingsProgressSeries", () => {
  it("returns an empty series when there are no contributions", () => {
    expect(buildSavingsProgressSeries([])).toEqual([]);
  });

  it("accumulates a single contribution into one readable point", () => {
    const series = buildSavingsProgressSeries([
      makeContribution({ id: "c1", amountCents: 5_000, contributedOn: "2026-03-01" }),
    ]);

    expect(series).toHaveLength(1);
    expect(series[0].date).toBe("2026-03-01");
    expect(series[0].cumulativeCents).toBe(5_000);
  });

  it("orders contributions by date ascending regardless of input order and accumulates amounts", () => {
    const series = buildSavingsProgressSeries([
      makeContribution({ id: "c3", amountCents: 3_000, contributedOn: "2026-03-10" }),
      makeContribution({ id: "c1", amountCents: 1_000, contributedOn: "2026-01-05" }),
      makeContribution({ id: "c2", amountCents: 2_000, contributedOn: "2026-02-15" }),
    ]);

    expect(series.map((point) => point.date)).toEqual([
      "2026-01-05",
      "2026-02-15",
      "2026-03-10",
    ]);
    expect(series.map((point) => point.cumulativeCents)).toEqual([1_000, 3_000, 6_000]);
  });

  it("accumulates multiple contributions on the same date as separate ordered points", () => {
    const series = buildSavingsProgressSeries([
      makeContribution({ id: "a", amountCents: 1_000, contributedOn: "2026-01-01" }),
      makeContribution({ id: "b", amountCents: 500, contributedOn: "2026-01-01" }),
    ]);

    expect(series).toHaveLength(2);
    expect(series[0].cumulativeCents).toBe(1_000);
    expect(series[1].cumulativeCents).toBe(1_500);
  });

  it("produces strictly increasing timestamps for ascending dates", () => {
    const series = buildSavingsProgressSeries([
      makeContribution({ id: "a", contributedOn: "2026-01-01" }),
      makeContribution({ id: "b", contributedOn: "2026-06-01" }),
    ]);

    expect(series[1].timestamp).toBeGreaterThan(series[0].timestamp);
  });
});
