import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FinancialScoreCard } from "./FinancialScoreCard";
import type { FinancialScore } from "./financialScore";

const { useFinancialScoreMock } = vi.hoisted(() => ({
  useFinancialScoreMock: vi.fn(),
}));

vi.mock("./financialScore", async () => {
  const actual = await vi.importActual<typeof import("./financialScore")>("./financialScore");
  return {
    ...actual,
    useFinancialScore: useFinancialScoreMock,
  };
});

vi.mock("../foundation-input/FoundationContext", () => ({
  useFoundation: () => ({
    data: {
      syncedAt: "2026-01-01T00:00:00Z",
      transactions: [],
      profile: { emergencyFundBalanceCents: 0, onboardingCompleted: false },
      recurringWorkCosts: [],
      essentialExpenses: [],
    },
  }),
}));

function makeScore(overrides: Partial<FinancialScore> = {}): FinancialScore {
  return {
    score: 100,
    band: "steady",
    generatedAt: "2026-01-01T00:00:00Z",
    scoredMaxPoints: 60,
    components: [
      {
        id: "emergency_fund",
        label: "Emergency fund",
        status: "not_enough_information",
        points: 0,
        maxPoints: 40,
        detail: "Add an essential expense or a target so we can measure your emergency fund.",
      },
      {
        id: "savings_habit",
        label: "Savings habit",
        status: "scored",
        points: 30,
        maxPoints: 30,
        detail: "Great habit.",
      },
      {
        id: "cash_flow",
        label: "Cash flow",
        status: "scored",
        points: 30,
        maxPoints: 30,
        detail: "Looking steady.",
      },
    ],
    nextStep: null,
    missingInputs: [],
    ...overrides,
  };
}

function renderCard() {
  return render(
    <MemoryRouter>
      <FinancialScoreCard />
    </MemoryRouter>
  );
}

describe("FinancialScoreCard", () => {
  afterEach(() => {
    cleanup();
    useFinancialScoreMock.mockReset();
  });

  it("shows a plain-language partial-basis note, with the right counts, when the score does not cover every area", async () => {
    useFinancialScoreMock.mockReturnValue({ score: makeScore(), loading: false, failed: false });

    renderCard();

    await waitFor(() =>
      expect(screen.getByText("Based on 2 of 3 areas. Add the missing one for a full picture.")).toBeInTheDocument()
    );
  });

  it("renders no basis note when every area was scored", async () => {
    useFinancialScoreMock.mockReturnValue({
      score: makeScore({
        scoredMaxPoints: 100,
        components: [
          { id: "emergency_fund", label: "Emergency fund", status: "scored", points: 40, maxPoints: 40, detail: "On track." },
          { id: "savings_habit", label: "Savings habit", status: "scored", points: 30, maxPoints: 30, detail: "Great habit." },
          { id: "cash_flow", label: "Cash flow", status: "scored", points: 30, maxPoints: 30, detail: "Looking steady." },
        ],
      }),
      loading: false,
      failed: false,
    });

    renderCard();

    await waitFor(() => expect(screen.getByText("Steady")).toBeInTheDocument());
    expect(screen.queryByText(/Based on \d+ of \d+ areas/)).not.toBeInTheDocument();
  });

  it("leaves the not-enough-information state untouched when there is no score yet", async () => {
    useFinancialScoreMock.mockReturnValue({ score: makeScore({ score: null }), loading: false, failed: false });

    renderCard();

    await waitFor(() =>
      expect(screen.getByText(/not enough information yet to calculate a score/i)).toBeInTheDocument()
    );
    expect(screen.queryByText(/Based on \d+ of \d+ areas/)).not.toBeInTheDocument();
  });

  it("renders the missing-inputs checklist with links when items remain, even once a score exists", async () => {
    useFinancialScoreMock.mockReturnValue({
      score: makeScore({
        missingInputs: [
          { id: "essential_expense", label: "An essential expense", action: "Add an essential expense", route: "/profile" },
        ],
      }),
      loading: false,
      failed: false,
    });

    renderCard();

    await waitFor(() => expect(screen.getByText("Add an essential expense")).toBeInTheDocument());
    const link = screen.getByRole("link", { name: "Add an essential expense" });
    expect(link).toHaveAttribute("href", "/profile");
  });

  it("renders the missing-inputs checklist when there is no score yet", async () => {
    useFinancialScoreMock.mockReturnValue({
      score: makeScore({
        score: null,
        missingInputs: [
          { id: "transactions", label: "At least one transaction", action: "Add a transaction", route: "/transactions/new" },
        ],
      }),
      loading: false,
      failed: false,
    });

    renderCard();

    await waitFor(() => expect(screen.getByText("Add a transaction")).toBeInTheDocument());
  });
});
