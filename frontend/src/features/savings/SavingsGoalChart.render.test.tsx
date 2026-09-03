import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SavingsGoalChart } from "./SavingsGoalChart";
import type { SavingsContribution } from "./types";

function makeContribution(
  overrides: Partial<SavingsContribution> = {},
): SavingsContribution {
  return {
    id: "c1",
    amountCents: 5_000,
    contributedOn: "2026-01-01",
    note: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("SavingsGoalChart", () => {
  it("renders a short empty state instead of an axis when there are no contributions", () => {
    render(
      <SavingsGoalChart
        goalName="New phone"
        contributions={[]}
        targetCents={100_000}
        targetDate={null}
      />,
    );

    expect(
      screen.getByText(/add a contribution to start this goal.s progress chart/i),
    ).toBeInTheDocument();
  });

  it("renders a readable chart and an accessible summary for a single contribution", () => {
    render(
      <SavingsGoalChart
        goalName="New phone"
        contributions={[makeContribution({ amountCents: 25_000 })]}
        targetCents={100_000}
        targetDate={null}
      />,
    );

    expect(
      screen.getByText(/new phone: \$250\.00 saved of a \$1,000\.00 target/i),
    ).toBeInTheDocument();
  });
});
