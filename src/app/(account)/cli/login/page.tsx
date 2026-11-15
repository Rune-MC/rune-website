import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cliLoginPath, normalizeUserCode } from "@/lib/auth/cli-login";
import { currentUser } from "@/lib/auth/server";
import { CliLogin } from "@/lib/db/models/cli-login";

export const metadata: Metadata = {
  title: "Sign in to the Rune CLI",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function approveLogin(form: FormData) {
  "use server";

  const code = normalizeUserCode(form.get("code"));
  const user = await currentUser();
  const returnPath = cliLoginPath(code);
  if (!user) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  if (!user.doc.username) {
    redirect(`/dashboard/welcome?next=${encodeURIComponent(returnPath)}`);
  }
  if (user.doc.suspendedAt) redirect("/cli/login?status=unavailable");
  if (!code) redirect("/cli/login?status=invalid");

  const approved = await CliLogin.findOneAndUpdate(
    {
      userCode: code,
      expiresAt: { $gt: new Date() },
      userId: { $exists: false },
    },
    { $set: { userId: user.doc._id } },
    { returnDocument: "after" },
  ).lean();
  if (!approved) redirect("/cli/login?status=invalid");
  if (approved.redirectUri && approved.state) {
    const callback = new URL(approved.redirectUri);
    callback.searchParams.set("state", approved.state);
    redirect(callback.toString());
  }
  redirect("/cli/login?status=approved");
}

export default async function CliLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; status?: string }>;
}) {
  const params = await searchParams;
  const code = normalizeUserCode(params.code);
  const me = await currentUser();
  const returnPath = cliLoginPath(code);
  if (me && !me.doc.username) {
    redirect(`/dashboard/welcome?next=${encodeURIComponent(returnPath)}`);
  }
  const approved = params.status === "approved";
  const unavailable =
    params.status === "unavailable" || Boolean(me?.doc.suspendedAt);
  const invalid = params.status === "invalid";

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <section
        className="w-full max-w-sm space-y-5"
        aria-labelledby="cli-login-heading"
      >
        <h1
          id="cli-login-heading"
          className="text-3xl font-medium tracking-tight text-display"
        >
          {approved ? "CLI sign-in approved" : "Sign in to the Rune CLI"}
        </h1>
        {approved ? (
          <p>Return to your terminal to finish signing in.</p>
        ) : unavailable ? (
          <p>CLI sign-in is unavailable for this account.</p>
        ) : !me ? (
          <>
            <p>
              Sign in to Runebook to approve the request from your terminal.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(returnPath)}`}
              className="site-button site-button-primary"
            >
              Sign in with GitHub
            </Link>
          </>
        ) : (
          <form action={approveLogin} className="space-y-4">
            <p id="cli-code-help">
              Approve only if the code matches your terminal. This device will
              be able to read private Runebook packages and publish as{" "}
              <strong>@{me.doc.username}</strong>.
            </p>
            <div className="space-y-2">
              <label htmlFor="cli-code" className="block text-sm font-medium">
                Terminal code
              </label>
              <input
                id="cli-code"
                name="code"
                type="text"
                defaultValue={
                  code ? code.replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3") : ""
                }
                autoComplete="one-time-code"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
                maxLength={32}
                aria-invalid={invalid || undefined}
                aria-describedby={
                  invalid ? "cli-code-help cli-code-error" : "cli-code-help"
                }
                className="w-full rounded border border-input bg-background px-3 py-3 font-mono text-base text-foreground"
              />
            </div>
            {invalid && (
              <p
                id="cli-code-error"
                role="alert"
                className="text-sm text-destructive"
              >
                Check the code or run <code>rune login</code> again to get a new
                one.
              </p>
            )}
            <button type="submit" className="site-button site-button-primary">
              Approve CLI sign-in
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
