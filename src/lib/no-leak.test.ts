import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(path.resolve(__dirname, ".."));
const isClient = (src: string) => /^\s*(\/\/.*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(src);

describe("nothing private reaches the browser", () => {
  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(40);
  });
  it("no hardcoded email addresses in source (placeholders on example.com are fine)", () => {
    const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g;
    const hits = files.flatMap((f) =>
      (readFileSync(f, "utf8").match(re) ?? []).filter((m) => !m.endsWith("example.com")).map((m) => `${f}: ${m}`)
    );
    expect(hits).toEqual([]);
  });
  it("secret env vars are never referenced from client components", () => {
    const secret = /ADMIN_EMAIL|SERVICE_ROLE|RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|NEWSLETTER_SECRET|RESEND_API_KEY|STORE_NOTIFY_EMAIL|CLOUDINARY_API_SECRET/;
    const bad = files.filter((f) => {
      const s = readFileSync(f, "utf8");
      return isClient(s) && secret.test(s);
    });
    expect(bad).toEqual([]);
  });
  it("no secret is exposed through a NEXT_PUBLIC_ variable", () => {
    const bad = files.filter((f) =>
      /NEXT_PUBLIC_[A-Z_]*(SECRET|SERVICE|ADMIN|RAZORPAY_KEY_SECRET|RESEND)/.test(readFileSync(f, "utf8"))
    );
    expect(bad).toEqual([]);
  });
  it("client components do not import server-only modules", () => {
    const serverOnly = /@\/lib\/(supabase\/admin|finalize-order|email|stock|catalog|admin-auth)/;
    const bad = files.filter((f) => {
      const s = readFileSync(f, "utf8");
      return isClient(s) && serverOnly.test(s);
    });
    expect(bad).toEqual([]);
  });
});
