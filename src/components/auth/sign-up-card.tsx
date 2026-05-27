"use client";

import { LocksmithSignUpForm } from "@getlocksmith/nextjs/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { runeFormClassNames } from "./form-theme";

export function SignUpCard() {
  const router = useRouter();
  const [oauthRedirectUrl, setOauthRedirectUrl] = useState("/auth/callback");

  useEffect(() => {
    setOauthRedirectUrl(`${window.location.origin}/auth/callback`);
  }, []);

  return (
    <LocksmithSignUpForm
      theme="minimal"
      classNames={runeFormClassNames}
      title="Create a Rune account"
      description="Publish Runes and issue CLI tokens from one account."
      submitLabel="Create account"
      signInHref="/login"
      signInLinkText="Sign in"
      showConfirmPassword
      showPasswordStrength
      socialProviders={["github"]}
      oauthRedirectUrl={oauthRedirectUrl}
      onSuccess={() => router.push("/dashboard/welcome")}
    />
  );
}
