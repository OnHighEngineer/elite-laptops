import { signToken } from "@/lib/security";

export function siteBase(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  // Never email customers a localhost link: refuse instead of guessing in production.
  if (process.env.NODE_ENV === "production") throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
  return "http://localhost:3000";
}

export function confirmUrl(email: string, secret: string): string {
  const t = signToken({ email, purpose: "confirm" }, secret);
  return `${siteBase()}/api/subscribe/confirm?token=${encodeURIComponent(t)}`;
}

export function unsubscribeUrl(email: string, secret: string): string {
  const t = signToken({ email, purpose: "unsubscribe" }, secret, Date.now(), 365 * 24 * 3600 * 1000);
  return `${siteBase()}/api/subscribe/unsubscribe?token=${encodeURIComponent(t)}`;
}
