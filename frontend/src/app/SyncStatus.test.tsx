import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SyncStatus } from "./SyncStatus";
import type { PendingMutation } from "../lib/offline";

const { useFoundationMock } = vi.hoisted(() => ({ useFoundationMock: vi.fn() }));

vi.mock("../features/foundation-input/FoundationContext", () => ({
  useFoundation: useFoundationMock,
}));

function mockFoundation(overrides: Partial<{ online: boolean; pending: PendingMutation[] }>) {
  useFoundationMock.mockReturnValue({
    online: true,
    pending: [],
    syncNow: vi.fn(),
    resolveConflict: vi.fn(),
    ...overrides,
  });
}

describe("SyncStatus", () => {
  afterEach(() => {
    cleanup();
    useFoundationMock.mockReset();
  });

  it("renders nothing when there are no pending mutations", () => {
    mockFoundation({ pending: [] });
    const { container } = render(<SyncStatus navOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while mutations are only pending or syncing, not failed or in conflict", () => {
    mockFoundation({
      pending: [
        { id: "1", ownerId: "u", method: "PUT", path: "/x", createdAt: "now", status: "pending" },
        { id: "2", ownerId: "u", method: "PUT", path: "/y", createdAt: "now", status: "syncing" },
      ],
    });
    const { container } = render(<SyncStatus navOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the floating button once a mutation has failed", () => {
    mockFoundation({
      pending: [{ id: "1", ownerId: "u", method: "PUT", path: "/x", createdAt: "now", status: "failed" }],
    });
    render(<SyncStatus navOpen={false} />);
    expect(screen.getByRole("button", { name: /need.*attention/i })).toBeInTheDocument();
  });

  it("shows the floating button and reachable conflict actions once a mutation is in conflict", () => {
    mockFoundation({
      pending: [{ id: "1", ownerId: "u", method: "PUT", path: "/x", createdAt: "now", status: "conflict" }],
    });
    render(<SyncStatus navOpen={false} />);
    const trigger = screen.getByRole("button", { name: /need.*attention/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Use server" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep mine" })).toBeInTheDocument();
  });

  it("keeps the offline banner independent of sync status", () => {
    mockFoundation({ online: false, pending: [] });
    render(<SyncStatus navOpen={false} />);
    expect(screen.getByText(/Offline/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /need.*attention/i })).not.toBeInTheDocument();
  });
});
