"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "error"; text?: string }>({ kind: "idle" });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), website: form.get("website") }),
      });
      const data = await res.json();
      setState(res.ok ? { kind: "ok", text: data.message } : { kind: "error", text: data.error });
    } catch {
      setState({ kind: "error", text: "Something went wrong. Please try again." });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <label htmlFor="subscribe-email" className="block text-xs font-semibold uppercase tracking-widest text-[#666666]">
        Get new arrivals and offers
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="subscribe-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="flex-1 min-w-[10rem] min-h-11 px-4 rounded-xl bg-[#1B1B1B] border border-[#2A2A2A] text-base text-white placeholder:text-[#777777] focus:outline-none focus:ring-1 focus:ring-white"
        />
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          type="submit"
          disabled={state.kind === "busy"}
          className="min-h-11 px-5 rounded-xl bg-white text-[#111111] text-sm font-semibold hover:bg-[#F5F5F5] disabled:opacity-50"
        >
          {state.kind === "busy" ? "…" : "Subscribe"}
        </button>
      </div>
      {state.text && (
        <p role={state.kind === "error" ? "alert" : "status"} className={`text-xs ${state.kind === "error" ? "text-[#FF8A8A]" : "text-[#999999]"}`}>
          {state.text}
        </p>
      )}
      <p className="text-[11px] text-[#777777]">We email only after you confirm. Unsubscribe any time.</p>
    </form>
  );
}
