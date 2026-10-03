"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  login,
  requestReset,
  signInWithGoogle,
  signup,
  updatePassword,
} from "@/app/auth/actions";
import { EmailField, FormMessage, PasswordField, SubmitButton } from "@/components/auth/fields";

export function GoogleButton() {
  return (
    <form action={signInWithGoogle}>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 w-full min-h-12 border border-[#E5E5E5] rounded-xl text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5] transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-[#999999]">
      <span className="h-px flex-1 bg-[#E5E5E5]" />
      or
      <span className="h-px flex-1 bg-[#E5E5E5]" />
    </div>
  );
}

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <>
      <GoogleButton />
      <Divider />
      <form action={action} className="space-y-5">
        <input type="hidden" name="next" value={next ?? ""} />
        <EmailField />
        <PasswordField mode="login" />
        {linkError && !state && (
          <p role="alert" className="text-sm text-[#B00020]">
            That link is invalid or has expired. Please try again.
          </p>
        )}
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Sign in</SubmitButton>
      </form>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="inline-flex items-center min-h-11 text-[#666666] hover:text-[#111111] underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="inline-flex items-center min-h-11 text-[#111111] font-medium hover:underline">
          Create account
        </Link>
      </div>
    </>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <>
      <GoogleButton />
      <Divider />
      <form action={action} className="space-y-5">
        <EmailField />
        <PasswordField mode="new" />
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
      <p className="text-sm text-center text-[#666666]">
        Already have an account?{" "}
        <Link href="/login" className="inline-flex items-center min-h-11 text-[#111111] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  return (
    <form action={action} className="space-y-5">
      <EmailField />
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
      <Link href="/login" className="flex items-center justify-center min-h-11 text-sm text-[#666666] hover:text-[#111111] underline">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="space-y-5">
      <PasswordField mode="new" label="New password" />
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
