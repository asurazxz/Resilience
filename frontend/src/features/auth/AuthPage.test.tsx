import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthPage } from "./AuthPage";

const signUp = vi.fn();

vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    configured: true,
    signIn: vi.fn(),
    signUp,
  }),
}));

describe("AuthPage", () => {
  it("explains password requirements concisely and opens onboarding after sign-up", async () => {
    signUp.mockResolvedValueOnce(null);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/signin"]}>
        <Routes>
          <Route path="/signin" element={<AuthPage />} />
          <Route path="/onboarding" element={<p>Onboarding</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("At least 12 characters, with uppercase and lowercase letters, a number, and a symbol.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText(/Password/), "Good-password-1!");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(signUp).toHaveBeenCalledWith("person@example.com", "Good-password-1!");
    expect(await screen.findByText("Onboarding")).toBeInTheDocument();
  });
});
