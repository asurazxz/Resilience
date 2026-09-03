import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SavingsPage } from "./SavingsPage";
import type { SavingsApi } from "./api";
import type { SavingsGoal } from "./types";

function makeGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: "goal-1",
    name: "New phone",
    targetCents: 100_000,
    targetDate: null,
    status: "active",
    savedCents: 25_000,
    remainingCents: 75_000,
    reached: false,
    suggestedWeeklyCents: null,
    contributions: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function fakeApi(goals: SavingsGoal[]): SavingsApi {
  return {
    listGoals: async () => goals,
    createGoal: async () => makeGoal(),
    updateGoal: async () => makeGoal(),
    deleteGoal: async () => undefined,
    addContribution: async () => makeGoal(),
    deleteContribution: async () => undefined,
  };
}

describe("SavingsPage", () => {
  it("keeps the add-goal form collapsed until the primary action is used, then reveals and focuses it", async () => {
    const user = userEvent.setup();
    render(<SavingsPage api={fakeApi([])} />);

    await waitFor(() => screen.getByText(/no savings goals yet/i));
    expect(screen.queryByLabelText(/what are you saving for/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add a savings goal/i }));

    const nameField = await screen.findByLabelText(/what are you saving for/i);
    expect(nameField).toBeInTheDocument();
    await waitFor(() => expect(nameField).toHaveFocus());

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByLabelText(/what are you saving for/i)).not.toBeInTheDocument();
  });

  it("renders a goal as a collapsed summary row that expands into full detail on activation", async () => {
    const user = userEvent.setup();
    render(<SavingsPage api={fakeApi([makeGoal()])} />);

    const trigger = await screen.findByRole("button", { name: /new phone/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    // Collapsed: no full-detail controls (like the per-goal contribution
    // form) are present until the row is activated.
    expect(screen.queryByRole("button", { name: /add to this goal/i })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByRole("button", { name: /add to this goal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark complete/i })).toBeInTheDocument();
  });

  it("shows a reached badge only once the goal target is met", async () => {
    render(<SavingsPage api={fakeApi([makeGoal({ reached: true, savedCents: 100_000, remainingCents: 0 })])} />);

    expect(await screen.findByText(/reached/i)).toBeInTheDocument();
  });
});
