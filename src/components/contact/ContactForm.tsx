"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { validateContact, type ContactFields } from "@/lib/contact";

const EMPTY: ContactFields = { name: "", email: "", topic: "Order", message: "" };
const TOPICS = ["Order", "Warranty", "Exchange", "Other"];
const INPUT =
  "w-full min-h-11 px-4 py-3 border border-[#E5E5E5] rounded-xl text-base text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all bg-white";

type Errors = ReturnType<typeof validateContact>;

export function ContactForm() {
  const [fields, setFields] = useState<ContactFields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const set =
    (k: keyof ContactFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateContact(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSent(true);
    setFields(EMPTY);
  };

  if (sent) {
    return (
      <div
        role="status"
        className="bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm text-center space-y-3"
      >
        <CheckCircle2 className="w-10 h-10 mx-auto text-[#111111]" aria-hidden />
        <p className="font-semibold text-[#111111]">Thanks, we will reply by email shortly.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-sm text-[#666666] underline hover:text-[#111111] min-h-11"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit}
      className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-8 shadow-sm space-y-5 w-full text-left"
      noValidate
    >
      <Field id="name" label="Your Name" error={errors.name}>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={fields.name}
          onChange={set("name")}
          placeholder="Rajesh Kumar"
          className={INPUT}
        />
      </Field>
      <Field id="email" label="Email" error={errors.email}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={set("email")}
          placeholder="you@example.com"
          className={INPUT}
        />
      </Field>
      <Field id="topic" label="Topic">
        <select id="topic" value={fields.topic} onChange={set("topic")} className={INPUT}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field id="message" label="Message" error={errors.message}>
        <textarea
          id="message"
          value={fields.message}
          onChange={set("message")}
          rows={4}
          placeholder="How can we help?"
          className={`${INPUT} resize-none`}
        />
      </Field>

      <button
        id="contact-submit"
        type="submit"
        className="flex items-center justify-center gap-2 w-full min-h-12 py-3.5 bg-[#111111] text-white text-sm font-semibold rounded-xl hover:bg-[#111111]/85 transition-all shadow-sm active:scale-[0.99]"
      >
        <Send className="w-4 h-4" />
        Send message
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-2"
      >
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-[#B00020]">
          {error}
        </p>
      )}
    </div>
  );
}
