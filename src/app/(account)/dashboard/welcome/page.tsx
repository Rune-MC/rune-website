import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/server";
import { isDbConfigured } from "@/lib/db";
import { UsernameForm } from "./username-form";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function WelcomePage() {
  const bridged = await currentUser();
  if (!bridged) {
    if (!isDbConfigured()) {
      return (
        <div className="max-w-md">
          <p className="mb-6 font-mono text-xs text-muted-foreground">
            welcome
          </p>
          <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
            Pick a username.
          </h1>
          <p className="mt-4 text-sm text-foreground">
            Database isn't configured yet. The form below is visual-only until{" "}
            <code>MONGODB_URI</code> is set.
          </p>
          <div className="mt-8">
            <UsernameForm />
          </div>
        </div>
      );
    }
    redirect("/login?next=/dashboard/welcome");
  }

  if (bridged.doc.username) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-md">
      <p className="mb-6 font-mono text-xs text-muted-foreground">welcome</p>
      <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
        Pick a username.
      </h1>
      <p className="mt-4 text-sm text-foreground">
        Your username becomes your scope on Runebook. Every Rune you publish
        lives under <code>@&lt;username&gt;/...</code>.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Signed in as <code>@{bridged.doc.githubLogin}</code> on GitHub.
      </p>
      <div className="mt-8">
        <UsernameForm />
      </div>
    </div>
  );
}
