import type { ApiErrorBody, ApiErrorPayload, FoundationBootstrap } from "../types/foundation";

// During local development Vite proxies /api to FastAPI. Keeping browser calls
// same-origin also lets embedded development browsers use the app without
// blocking a separate localhost:8000 request.
const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? window.location.origin);

/** Every backend route is served under this prefix. */
const API_PREFIX = "/api/v1";

/**
 * The single error type raised by {@link apiRequest}. It mirrors the backend's
 * unified error envelope so callers never have to inspect a raw Response.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorPayload["details"];
  readonly fieldErrors?: ApiErrorPayload["fieldErrors"];
  readonly requestId?: string;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
    this.fieldErrors = payload.fieldErrors;
    this.requestId = payload.requestId;
  }

  /** Serializable form, used by the offline mutation queue. */
  get payload(): ApiErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      fieldErrors: this.fieldErrors,
      requestId: this.requestId,
    };
  }
}

let accessTokenProvider: () => Promise<string | null> = async () => null;
export function setAccessTokenProvider(provider: () => Promise<string | null>) {
  accessTokenProvider = provider;
}

/**
 * Invoked once when a request comes back 401. Resolving `true` means a fresh
 * token is now available and the request should be retried exactly once.
 */
export type UnauthorizedHandler = () => Promise<boolean>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

async function sendRequest(
  path: string,
  init: RequestInit,
  idempotencyKey?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await accessTokenProvider();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  return fetch(`${API_BASE_URL}${API_PREFIX}${path}`, { ...init, headers });
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  idempotencyKey?: string,
): Promise<T> {
  let response = await sendRequest(path, init, idempotencyKey);
  if (response.status === 401 && unauthorizedHandler) {
    const recovered = await unauthorizedHandler();
    if (recovered) response = await sendRequest(path, init, idempotencyKey);
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, toErrorPayload(payload, response.status));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function toErrorPayload(payload: unknown, status: number): ApiErrorPayload {
  if (isApiErrorBody(payload)) {
    const error = payload.error;
    return { ...error, code: typeof error.code === "string" ? error.code : `HTTP_${status}` };
  }
  return {
    code: status === 401 ? "UNAUTHENTICATED" : `HTTP_${status}`,
    message: status === 401
      ? "Your session has expired. Please sign in again."
      : "The request could not be completed. Please try again.",
  };
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null
    && "error" in value
    && typeof value.error === "object" && value.error !== null
    && "message" in value.error
    && typeof value.error.message === "string";
}

export const fetchBootstrap = () => apiRequest<FoundationBootstrap>("/foundation/bootstrap");
