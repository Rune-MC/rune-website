import type { ApiResponse } from "./response";

/**
 * Thrown by `apiFetch` when the server returns a failure envelope or when
 * the response can't be parsed. Carries the same shape as `ApiFailure`.
 */
export class ApiError extends Error {
  readonly code: number;
  readonly kind: string;
  readonly details?: unknown;

  constructor(code: number, kind: string, message: string, details?: unknown) {
    super(message);
    this.name = kind;
    this.code = code;
    this.kind = kind;
    this.details = details;
  }
}

/**
 * Single client-side fetch wrapper for the `/api/v1/*` envelope. Returns
 * `T` (the `data` field of the success envelope) and throws `ApiError` on
 * any non-success response. Components never call `fetch` directly — they
 * use React Query hooks that call this internally.
 */
export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  let res: Response;
  try {
    res = await fetch(input, { ...init, headers });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Network error. Try again.");
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      res.status,
      "INVALID_RESPONSE",
      `Unexpected response (${res.status})`,
    );
  }

  if (!payload) {
    throw new ApiError(res.status, "INVALID_RESPONSE", "Empty response");
  }
  if (!payload.success) {
    throw new ApiError(
      payload.code,
      payload.error,
      payload.message,
      payload.details,
    );
  }
  return payload.data;
}
