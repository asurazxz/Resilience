import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { AuthProvider } from "../auth/AuthContext";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("exposes exactly one call to action, linking to sign-in when signed out", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LandingPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    const ctaLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/signin");
    expect(ctaLinks).toHaveLength(1);
    expect(ctaLinks[0]).toHaveTextContent(/get started/i);
  });

  it("keeps the top bar to the brand mark alone, with no competing action", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LandingPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    const nav = document.querySelector(".landing-nav");
    expect(nav).not.toBeNull();
    expect(nav!.querySelectorAll("a")).toHaveLength(1);
    expect(nav).toHaveTextContent("Resilience");
  });
});
