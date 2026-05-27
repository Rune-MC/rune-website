import { type NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { type AuthContext, type AuthMode, resolveAuth } from "./auth";
import { ApiException } from "./errors";
import { type ApiFailure, type ApiSuccess, isApiSuccess } from "./response";

type AuthSpec = false | AuthMode;

type ResolvedAuth<A extends AuthSpec> = A extends false
  ? null
  : A extends "optional"
    ? AuthContext | null
    : AuthContext;

interface RouteContext<TParams, TBody, TQuery, A extends AuthSpec> {
  req: NextRequest;
  params: TParams;
  body: TBody;
  query: TQuery;
  auth: ResolvedAuth<A>;
}

interface RouteOpts<TParams, TBody, TQuery, A extends AuthSpec, TResult> {
  params?: ZodType<TParams>;
  body?: ZodType<TBody>;
  query?: ZodType<TQuery>;
  auth?: A;
  handler: (
    ctx: RouteContext<TParams, TBody, TQuery, A>,
  ) =>
    | Promise<TResult | ApiSuccess<TResult> | Response>
    | TResult
    | ApiSuccess<TResult>
    | Response;
}

/**
 * Next.js route handler signature. Accepts a request + the framework-provided
 * `params` promise; returns a fully-formed `NextResponse`.
 */
export type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> },
) => Promise<NextResponse>;

/**
 * Wraps a route handler with:
 *  - Zod parsing for params, body, and query
 *  - Auth resolution (`session`, `cli`, `any`, `optional`, or `false`)
 *  - Auto-wrapping of plain return values in a success envelope
 *  - Auto-catching of `ApiException` and `ZodError` into failure envelopes
 *
 * Handler can either return a plain value (gets wrapped in `ok()`) or call
 * `ok()` / `created()` / `noContent()` explicitly for a different status.
 */
export function route<
  TResult,
  TParams = undefined,
  TBody = undefined,
  TQuery = undefined,
  A extends AuthSpec = "optional",
>(opts: RouteOpts<TParams, TBody, TQuery, A, TResult>): RouteHandler {
  return async (req, context) => {
    try {
      const params: TParams = opts.params
        ? opts.params.parse(await context.params)
        : (undefined as TParams);

      const query: TQuery = opts.query
        ? opts.query.parse(
            Object.fromEntries(new URL(req.url).searchParams.entries()),
          )
        : (undefined as TQuery);

      let body: TBody = undefined as TBody;
      if (opts.body) {
        if (req.method === "GET" || req.method === "HEAD") {
          // Body schemas don't make sense on GET/HEAD; treat as empty.
          body = opts.body.parse({});
        } else {
          const json = await req.json().catch(() => ({}));
          body = opts.body.parse(json);
        }
      }

      const authMode: AuthSpec = opts.auth ?? "optional";
      const auth = (
        authMode === false ? null : await resolveAuth(req, authMode)
      ) as ResolvedAuth<A>;

      const result = await opts.handler({
        req,
        params,
        body,
        query,
        auth,
      });

      // Handler returned a raw Response (redirect, cached JSON, streamed body).
      if (result instanceof Response) {
        return result as NextResponse;
      }

      if (isApiSuccess(result)) {
        return NextResponse.json(result, { status: result.code });
      }

      const envelope: ApiSuccess<TResult> = {
        success: true,
        code: 200,
        data: result as TResult,
      };
      return NextResponse.json(envelope, { status: 200 });
    } catch (err) {
      return renderError(err);
    }
  };
}

function renderError(err: unknown): NextResponse {
  if (err instanceof ApiException) {
    const body: ApiFailure = {
      success: false,
      code: err.code,
      error: err.kind,
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    };
    return NextResponse.json(body, { status: err.code });
  }

  if (err instanceof ZodError) {
    const body: ApiFailure = {
      success: false,
      code: 422,
      error: "VALIDATION_ERROR",
      message: "Request failed validation",
      details: err.issues,
    };
    return NextResponse.json(body, { status: 422 });
  }

  // Unknown failure. Log once on the server; never leak the message to the client.
  console.error("[api] unexpected error:", err);
  const body: ApiFailure = {
    success: false,
    code: 500,
    error: "INTERNAL_ERROR",
    message: "Something went wrong",
  };
  return NextResponse.json(body, { status: 500 });
}
