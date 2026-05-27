import { type NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export function POST(req: NextRequest) {
  const target = new URL("/", req.nextUrl.origin);
  const res = NextResponse.redirect(target, { status: 303 });
  clearSessionCookie(res);
  return res;
}
