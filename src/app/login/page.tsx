import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { safeNext } from "@/lib/auth-rules";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Elite Laptops account.">
      <LoginForm next={next ? safeNext(next) : undefined} linkError={error === "link"} />
    </AuthShell>
  );
}
