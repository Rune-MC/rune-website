import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { cliLoginExchange, exchangeCliLogin } from "@/lib/auth/cli-login";

export const POST = route({
  auth: false,
  body: cliLoginExchange,
  handler: async ({ body }) => {
    const data = await exchangeCliLogin(body);
    return NextResponse.json(
      { success: true, code: 200, data },
      { headers: { "Cache-Control": "no-store" } },
    );
  },
});
