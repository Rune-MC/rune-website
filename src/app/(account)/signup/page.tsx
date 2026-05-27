import type { Metadata } from "next";
import { SignUpCard } from "@/components/auth/sign-up-card";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignUpPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <SignUpCard />
    </div>
  );
}
