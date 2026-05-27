function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

interface Props {
  /** Optional next-URL to land on after sign-in. Same-origin only. */
  next?: string;
  /** Optional error code surfaced from the OAuth callback. */
  error?: string;
}

const ERROR_COPY: Record<string, string> = {
  state_mismatch: "Sign-in expired. Try again.",
  github_exchange_failed: "GitHub denied the sign-in. Try again.",
  user_upsert_failed: "Couldn't create your account. Try again.",
  missing_params: "GitHub didn't return the expected response.",
  unconfigured: "Sign-in is temporarily unavailable.",
  access_denied: "Sign-in was cancelled.",
};

export function SignInCard({ next, error }: Props) {
  const startUrl = next
    ? `/api/auth/github/start?next=${encodeURIComponent(next)}`
    : "/api/auth/github/start";
  const errorCopy = error ? (ERROR_COPY[error] ?? "Sign-in failed.") : null;

  return (
    <div className="w-full max-w-sm">
      <p className="mb-6 font-mono text-xs text-muted-foreground">sign in</p>
      <h1 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
        Welcome to Rune.
      </h1>
      <p className="mt-3 max-w-prose text-sm text-foreground">
        Sign in with GitHub to publish Runes, issue CLI tokens, and manage your
        Runebook scope.
      </p>

      {errorCopy && (
        <p
          role="alert"
          className="mt-6 rounded border border-destructive/40 bg-destructive/5 px-4 py-3 font-mono text-xs text-destructive"
        >
          {errorCopy}
        </p>
      )}

      <a
        href={startUrl}
        className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded border border-border bg-foreground px-5 py-3 font-mono text-sm text-background transition-colors hover:bg-display"
      >
        <GithubMark className="size-4" />
        Continue with GitHub
      </a>

      <p className="mt-6 font-mono text-xs text-muted-foreground">
        By signing in you agree to be a reasonable person about it.
      </p>
    </div>
  );
}
