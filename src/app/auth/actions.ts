"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { passwordProblems, safeNext, validateEmail } from "@/lib/auth-rules";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export type AuthState = { error?: string; message?: string } | undefined;

const NOT_CONFIGURED = "Sign-in is not available yet. Please try again later.";
const GENERIC_LOGIN = "Incorrect email or password, or the email is not verified yet.";

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  // Headers are attacker-controllable, so outside local development refuse rather than trust them.
  if (process.env.NODE_ENV === "production") throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
  const h = await headers();
  return `http://${h.get("host") ?? "localhost:3000"}`;
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return { error: NOT_CONFIGURED };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (validateEmail(email) || !password) return { error: GENERIC_LOGIN };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: GENERIC_LOGIN };
  redirect(safeNext(String(form.get("next") ?? "")));
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return { error: NOT_CONFIGURED };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const emailErr = validateEmail(email);
  if (emailErr) return { error: emailErr };
  const problems = passwordProblems(password);
  if (problems.length) return { error: problems[0] };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback?next=/account` },
  });
  // Same response whether or not the email already exists.
  if (error && error.status !== 400 && error.status !== 422) {
    return { error: "We could not create your account right now. Please try again." };
  }
  return { message: "Check your email to verify your account, then sign in." };
}

export async function requestReset(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return { error: NOT_CONFIGURED };
  const email = String(form.get("email") ?? "").trim();
  if (validateEmail(email) === null) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
    });
  }
  return { message: "If an account exists for that email, we have sent a reset link." };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return { error: NOT_CONFIGURED };
  const password = String(form.get("password") ?? "");
  const problems = passwordProblems(password);
  if (problems.length) return { error: problems[0] };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Please request a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Could not update your password. Please try again." };
  redirect("/account");
}

export async function signOut() {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteUrl()}/auth/callback?next=/account` },
  });
  if (error || !data.url) redirect("/login");
  redirect(data.url);
}
