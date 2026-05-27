"use client";

import { LocksmithSignInForm } from "@getlocksmith/nextjs/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { runeFormClassNames } from "./form-theme";

export function SignInCard() {
  const router = useRouter();
  const [oauthRedirectUrl, setOauthRedirectUrl] = useState("/auth/callback");

  useEffect(() => {
    setOauthRedirectUrl(`${window.location.origin}/auth/callback`);
  }, []);

  return (
    <LocksmithSignInForm
      theme="minimal"
      classNames={runeFormClassNames}
      title="Sign in to Rune"
      description="Use a social account, or email and password."
      submitLabel="Sign in"
      signUpHref="/signup"
      signUpLinkText="Create one"
      socialProviders={["github"]}
      oauthRedirectUrl={oauthRedirectUrl}
      onSuccess={() => router.push("/dashboard")}
    />
  );
}
