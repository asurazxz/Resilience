import type { ApiErrorBody, CsvPreview, FoundationBootstrap } from "../types/foundation";

// During local development Vite proxies /api to FastAPI. Keeping browser calls
// same-origin also lets embedded development browsers use the app without
// blocking a separate localhost:8000 request.
const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? window.location.origin);

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody
  ) {
    super(body.error.message);
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  idempotencyKey?: string
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, { ...init, headers });
  if (!response.ok) {
    const body = (await response.json()) as ApiErrorBody;
    throw new ApiError(response.status, body);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const fetchBootstrap = () => apiRequest<FoundationBootstrap>("/foundation/bootstrap");

export async function previewCsv(file: File): Promise<CsvPreview> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<CsvPreview>("/foundation/imports/csv/preview", { method: "POST", body });
}

export const csvTemplateUrl = `${API_BASE_URL}/api/v1/foundation/imports/csv/template`;
