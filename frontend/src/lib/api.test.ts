import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  apiRequest,
  setAccessTokenProvider,
  setUnauthorizedHandler,
} from "./api";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function envelope(code: string, message: string, extra: Record<string, unknown> = {}) {
  return { error: { code, message, requestId: "req-1", ...extra } };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  setAccessTokenProvider(async () => "token-1");
  setUnauthorizedHandler(null);
});

afterEach(() => {
  setAccessTokenProvider(async () => null);
  setUnauthorizedHandler(null);
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("prefixes /api/v1, sends the bearer token and returns the parsed body", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    const result = await apiRequest<{ ok: boolean }>("/foundation/bootstrap");

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/foundation/bootstrap");
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer token-1");
  });

  it("sets JSON content type and an idempotency key when given", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await apiRequest<void>(
      "/foundation/weeks",
      { method: "PUT", body: JSON.stringify({ a: 1 }) },
      "key-9",
    );

    expect(result).toBeUndefined();
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Idempotency-Key")).toBe("key-9");
  });

  it("parses the unified error envelope into one ApiError", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        422,
        envelope("VALIDATION_FAILED", "Check the highlighted fields.", {
          fieldErrors: [{ path: "amount_cents", message: "Must be positive." }],
          details: { hint: "amount" },
        }),
      ),
    );

    const error = await apiRequest("/resilience-jar/contributions", { method: "POST", body: "{}" })
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(422);
    expect(apiError.code).toBe("VALIDATION_FAILED");
    expect(apiError.message).toBe("Check the highlighted fields.");
    expect(apiError.fieldErrors).toEqual([{ path: "amount_cents", message: "Must be positive." }]);
    expect(apiError.details).toEqual({ hint: "amount" });
    expect(apiError.requestId).toBe("req-1");
    expect(apiError.payload.code).toBe("VALIDATION_FAILED");
  });

  it("falls back to a safe envelope when the response is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>502</html>", { status: 502 }));

    const error = (await apiRequest("/foundation/bootstrap").catch((cause) => cause)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.code).toBe("HTTP_502");
    expect(error.message).toContain("could not be completed");
  });

  it("reports UNAUTHENTICATED for a 401 with no parseable envelope", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 401 }));

    const error = (await apiRequest("/foundation/bootstrap").catch((cause) => cause)) as ApiError;

    expect(error.status).toBe(401);
    expect(error.code).toBe("UNAUTHENTICATED");
  });

  it("lets a network failure surface as a TypeError, not an ApiError", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await apiRequest("/foundation/bootstrap").catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});

describe("401 handling", () => {
  it("retries the request once after the handler recovers the session", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, envelope("UNAUTHENTICATED", "Token expired.")))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    let tokenCalls = 0;
    setAccessTokenProvider(async () => `token-${++tokenCalls}`);
    const handler = vi.fn(async () => true);
    setUnauthorizedHandler(handler);

    const result = await apiRequest<{ ok: boolean }>("/foundation/bootstrap");

    expect(result).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // The retry re-reads the token, so the refreshed one is used.
    expect((fetchMock.mock.calls[1][1].headers as Headers).get("Authorization")).toBe("Bearer token-2");
  });

  it("throws UNAUTHENTICATED without retrying when the refresh fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, envelope("UNAUTHENTICATED", "Token expired.")));
    const handler = vi.fn(async () => false);
    setUnauthorizedHandler(handler);

    const error = (await apiRequest("/foundation/bootstrap").catch((cause) => cause)) as ApiError;

    expect(handler).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.code).toBe("UNAUTHENTICATED");
  });

  it("does not retry more than once when the retry is also unauthorized", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, envelope("UNAUTHENTICATED", "Token expired.")));
    const handler = vi.fn(async () => true);
    setUnauthorizedHandler(handler);

    const error = (await apiRequest("/foundation/bootstrap").catch((cause) => cause)) as ApiError;

    expect(handler).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(error.status).toBe(401);
  });
});
