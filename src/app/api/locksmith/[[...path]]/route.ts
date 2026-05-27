import {
  createLocksmithRouteHandlers,
  locksmithServerClientFromEnv,
} from "@getlocksmith/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

function buildHandlers() {
  const client = locksmithServerClientFromEnv();
  return createLocksmithRouteHandlers({
    apiKey: client.apiKey,
    baseUrl: client.baseUrl,
    routeBasePath: "/api/locksmith",
  });
}

function unconfigured() {
  return NextResponse.json(
    { error: "LOCKSMITH_API_KEY not configured" },
    { status: 503 },
  );
}

export async function GET(req: NextRequest) {
  if (!process.env.LOCKSMITH_API_KEY) return unconfigured();
  return buildHandlers().GET(req);
}

export async function POST(req: NextRequest) {
  if (!process.env.LOCKSMITH_API_KEY) return unconfigured();
  return buildHandlers().POST(req);
}
