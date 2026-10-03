import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" subtitle="Track orders and check out faster.">
      <SignupForm />
    </AuthShell>
  );
}
