/**
 * Base class for any error that should be serialized as the API failure
 * envelope. Throw subclasses from `Errors.*` inside a route handler; the
 * wrapper catches them and renders the JSON response.
 */
export class ApiException extends Error {
  readonly code: number;
  readonly kind: string;
  readonly details?: unknown;

  constructor(code: number, kind: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.kind = kind;
    this.details = details;
    this.name = kind;
  }
}

class BadRequestError extends ApiException {
  constructor(message = "Bad request", details?: unknown) {
    super(400, "BAD_REQUEST", message, details);
  }
}

class UnauthorizedError extends ApiException {
  constructor(message = "Authentication required", details?: unknown) {
    super(401, "UNAUTHORIZED", message, details);
  }
}

class ForbiddenError extends ApiException {
  constructor(message = "Not allowed", details?: unknown) {
    super(403, "FORBIDDEN", message, details);
  }
}

class NotFoundError extends ApiException {
  constructor(message = "Not found", details?: unknown) {
    super(404, "NOT_FOUND", message, details);
  }
}

class MethodNotAllowedError extends ApiException {
  constructor(message = "Method not allowed", details?: unknown) {
    super(405, "METHOD_NOT_ALLOWED", message, details);
  }
}

class ConflictError extends ApiException {
  constructor(message = "Conflict", details?: unknown) {
    super(409, "CONFLICT", message, details);
  }
}

class GoneError extends ApiException {
  constructor(message = "Gone", details?: unknown) {
    super(410, "GONE", message, details);
  }
}

class PayloadTooLargeError extends ApiException {
  constructor(message = "Payload too large", details?: unknown) {
    super(413, "PAYLOAD_TOO_LARGE", message, details);
  }
}

class UnprocessableEntityError extends ApiException {
  constructor(message = "Unprocessable entity", details?: unknown) {
    super(422, "VALIDATION_ERROR", message, details);
  }
}

class TooManyRequestsError extends ApiException {
  constructor(message = "Too many requests", details?: unknown) {
    super(429, "TOO_MANY_REQUESTS", message, details);
  }
}

class InternalError extends ApiException {
  constructor(message = "Internal server error", details?: unknown) {
    super(500, "INTERNAL_ERROR", message, details);
  }
}

class NotImplementedError extends ApiException {
  constructor(message = "Not implemented", details?: unknown) {
    super(501, "NOT_IMPLEMENTED", message, details);
  }
}

class ServiceUnavailableError extends ApiException {
  constructor(message = "Service unavailable", details?: unknown) {
    super(503, "SERVICE_UNAVAILABLE", message, details);
  }
}

export const Errors = {
  BadRequest: BadRequestError,
  Unauthorized: UnauthorizedError,
  Forbidden: ForbiddenError,
  NotFound: NotFoundError,
  MethodNotAllowed: MethodNotAllowedError,
  Conflict: ConflictError,
  Gone: GoneError,
  PayloadTooLarge: PayloadTooLargeError,
  Validation: UnprocessableEntityError,
  TooManyRequests: TooManyRequestsError,
  Internal: InternalError,
  NotImplemented: NotImplementedError,
  ServiceUnavailable: ServiceUnavailableError,
} as const;

export type ErrorKind =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "CONFLICT"
  | "GONE"
  | "PAYLOAD_TOO_LARGE"
  | "VALIDATION_ERROR"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "NOT_IMPLEMENTED"
  | "SERVICE_UNAVAILABLE";
