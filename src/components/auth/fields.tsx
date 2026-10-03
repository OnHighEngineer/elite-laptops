"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { passwordProblems, passwordStrength } from "@/lib/auth-rules";

export const INPUT =
  "w-full min-h-11 px-4 py-3 border border-[#E5E5E5] rounded-xl text-base text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all bg-white";

export const LABEL = "block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-2";

export function EmailField() {
  return (
    <div>
      <label htmlFor="email" className={LABEL}>Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        className={INPUT}
      />
    </div>
  );
}

const STRENGTH = ["", "Weak", "Fair", "Good", "Strong"];

export function PasswordField({
  mode,
  label = "Password",
}: {
  mode: "login" | "new";
  label?: string;
}) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  const strength = passwordStrength(value);
  const problems = mode === "new" && value ? passwordProblems(value) : [];

  return (
    <div>
      <label htmlFor="password" className={LABEL}>{label}</label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete={mode === "new" ? "new-password" : "current-password"}
          required
          minLength={mode === "new" ? 10 : undefined}
          maxLength={72}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={mode === "new" ? "password-help" : undefined}
          className={`${INPUT} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-0 top-0 w-11 h-11 flex items-center justify-center text-[#666666] hover:text-[#111111]"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {mode === "new" && (
        <div id="password-help" className="mt-2 space-y-1.5">
          <div className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i <= strength ? "bg-[#111111]" : "bg-[#E5E5E5]"}`}
              />
            ))}
          </div>
          <p className="text-xs text-[#666666]">
            {value ? `Strength: ${STRENGTH[strength]}` : "Use 10+ characters with upper, lower case and a number."}
          </p>
          {problems.length > 0 && (
            <ul className="text-xs text-[#B00020] space-y-0.5">
              {problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function FormMessage({ state }: { state?: { error?: string; message?: string } }) {
  if (!state) return null;
  if (state.error)
    return <p role="alert" className="text-sm text-[#B00020]">{state.error}</p>;
  if (state.message)
    return <p role="status" className="text-sm text-[#111111] bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg p-3">{state.message}</p>;
  return null;
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center w-full min-h-12 py-3 bg-[#111111] text-white text-sm font-semibold rounded-xl hover:bg-[#111111]/85 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
