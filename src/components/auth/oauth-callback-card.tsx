"use client";

import { LocksmithOAuthCallback } from "@getlocksmith/nextjs/client";
import { runeFormClassNames } from "./form-theme";

export function OAuthCallbackCard() {
  return (
    <LocksmithOAuthCallback
      theme="minimal"
      classNames={runeFormClassNames}
      redirectTo="/dashboard/welcome"
      title="Completing sign-in"
      description="One moment."
      successTitle="Signed in"
      successDescription="Redirecting to your dashboard."
      errorTitle="Sign-in failed"
      errorDescription="Try signing in again."
    />
  );
}
