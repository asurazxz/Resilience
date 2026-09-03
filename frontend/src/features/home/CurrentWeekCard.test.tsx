import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { CurrentWeekCard } from "./CurrentWeekCard";
import type { WeeklyEntryIn } from "../income-reality/types";

function renderCard(weeks: WeeklyEntryIn[], today: string) {
  return render(
    <MemoryRouter>
      <CurrentWeekCard today={today} weeks={weeks} />
    </MemoryRouter>
  );
}

describe("CurrentWeekCard", () => {
  afterEach(cleanup);

  it("shows an empty state when the current week has no entries yet", () => {
    // 2026-01-14 is a Wednesday; its Monday is 2026-01-12.
    renderCard([], "2026-01-14");
    expect(screen.getByText(/No entries yet for this week/i)).toBeInTheDocument();
  });

  it("shows money in, money out, and what remains for the week containing today", () => {
    const weeks: WeeklyEntryIn[] = [
      {
        week_start: "2026-01-12",
        platform_earnings: [{ platform: "Recorded income", gross_cents: 50_000 }],
        work_costs_cents: 8_000,
        essential_expenses_cents: 12_000,
        recorded_cpf_cents: null,
      },
    ];
    renderCard(weeks, "2026-01-14");
    expect(screen.getByText("+$500.00")).toBeInTheDocument();
    expect(screen.getByText("−$200.00")).toBeInTheDocument();
    expect(screen.getByText("$300.00")).toBeInTheDocument();
  });

  it("ignores weeks other than the one containing today", () => {
    const weeks: WeeklyEntryIn[] = [
      {
        week_start: "2026-01-05",
        platform_earnings: [{ platform: "Recorded income", gross_cents: 99_999 }],
        work_costs_cents: 0,
        essential_expenses_cents: 0,
        recorded_cpf_cents: null,
      },
    ];
    renderCard(weeks, "2026-01-14");
    expect(screen.getByText(/No entries yet for this week/i)).toBeInTheDocument();
  });
});
