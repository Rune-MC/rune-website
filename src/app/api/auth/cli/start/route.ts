import { route } from "@/lib/api";
import { cliLoginStart, startCliLogin } from "@/lib/auth/cli-login";

export const POST = route({
  auth: false,
  body: cliLoginStart,
  handler: async ({ req, body }) =>
    startCliLogin(body, req.headers.get("x-vercel-forwarded-for")),
});
