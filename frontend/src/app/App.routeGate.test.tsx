import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import type { FoundationBootstrap } from "../types/foundation";

const { useAuthMock, useFoundationMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useFoundationMock: vi.fn(),
}));

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: useAuthMock,
}));

vi.mock("../features/foundation-input/FoundationContext", () => ({
  useFoundation: useFoundationMock,
}));

function bootstrap(onboardingCompleted: boolean): FoundationBootstrap {
  return {
    profile: {
      id: "user-1",
      currency: "SGD",
      timezone: "Asia/Singapore",
      onboardingCompleted,
      latestEmergencySavingsCents: 0,
      emergencyFundBalanceCents: 0,
    },
    recurringWorkCosts: [],
    essentialExpenses: [],
    weeklyEntries: [],
    transactions: [],
    syncedAt: new Date(0).toISOString(),
  };
}

function mockAuth() {
  useAuthMock.mockReturnValue({
    configured: true,
    loading: false,
    session: { access_token: "t", refresh_token: "r", user: { id: "user-1" } },
    user: { id: "user-1", email: "person@example.com" },
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  });
}

function mockFoundation(overrides: Partial<{
  data: FoundationBootstrap;
  loading: boolean;
  bootstrapLoaded: boolean;
}>) {
  useFoundationMock.mockReturnValue({
    data: bootstrap(false),
    loading: false,
    bootstrapLoaded: true,
    online: true,
    pending: [],
    refresh: vi.fn(),
    syncNow: vi.fn(),
    resolveConflict: vi.fn(),
    saveOnboarding: vi.fn(),
    saveTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    saveAssumptions: vi.fn(),
    resetData: vi.fn(),
    ...overrides,
  });
}

describe("App route gate", () => {
  afterEach(() => {
    cleanup();
    useAuthMock.mockReset();
    useFoundationMock.mockReset();
  });

  it("shows the landing page for a genuinely new user whose bootstrap succeeded", () => {
    mockAuth();
    mockFoundation({ data: bootstrap(false), bootstrapLoaded: true });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Get started — it takes two minutes/i)).toBeInTheDocument();
  });

  it("does not show the landing page when the bootstrap failed for a returning user with a cached completed profile", () => {
    mockAuth();
    // bootstrapLoaded is false (bootstrap never confirmed), but the cached
    // profile on the object still says onboarding is complete-ish default
    // (false, as EMPTY_BOOTSTRAP would report) — the failed-load signal must
    // still suppress the marketing page.
    mockFoundation({ data: bootstrap(false), bootstrapLoaded: false });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Get started — it takes two minutes/i)).not.toBeInTheDocument();
  });

  it("shows the normal shell, not the landing page, for an existing user once bootstrap confirms onboarding is complete", () => {
    mockAuth();
    mockFoundation({ data: bootstrap(true), bootstrapLoaded: true });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Get started — it takes two minutes/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Your money at a glance/i)).toBeInTheDocument();
  });
});
