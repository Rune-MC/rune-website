import type { ErrorKind } from "./errors";

export interface ApiSuccess<T> {
  success: true;
  code: number;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  code: number;
  error: ErrorKind | string;
  message: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/**
 * Structural check: a value is already a wrapped success envelope.
 * Used by the route wrapper to decide whether to wrap a plain return value.
 */
export function isApiSuccess(value: unknown): value is ApiSuccess<unknown> {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.success === true && typeof v.code === "number" && "data" in v;
}

export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, code: 200, data, message };
}

export function created<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, code: 201, data, message };
}

export function accepted<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, code: 202, data, message };
}

/**
 * 200 with `data: null`. Named for the DELETE-style "nothing to return" intent;
 * the envelope itself is the body, so we stay on 200 rather than HTTP 204
 * (which forbids a body).
 */
export function noContent(): ApiSuccess<null> {
  return { success: true, code: 200, data: null };
}
