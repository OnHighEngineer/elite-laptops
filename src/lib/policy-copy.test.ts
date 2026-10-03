import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "admin") continue; // staff-only screens may say "refund" about sold-out orders
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(path.resolve(__dirname, ".."));

describe("store policy: exchange only, no returns, no refunds", () => {
  it("scans a meaningful number of files", () => expect(files.length).toBeGreaterThan(40));

  it("customer-facing pages never promise returns or refunds for change of mind", () => {
    const banned = /day returns?|Refund & Returns|Not happy\? Return|warranty or returns|Return any|money[- ]back|easy returns?|free returns?|return policy/i;
    const hits = files.flatMap((f) => (readFileSync(f, "utf8").match(banned) ? [f] : []));
    expect(hits).toEqual([]);
  });

  it("the policy page is at /exchange and the old /returns page is gone", () => {
    expect(files.some((f) => f.endsWith(path.join("app", "exchange", "page.tsx")))).toBe(true);
    expect(files.some((f) => f.endsWith(path.join("app", "returns", "page.tsx")))).toBe(false);
  });

  it("the policy page says exchange only and keeps the one honest exception", () => {
    const page = readFileSync(path.resolve(__dirname, "..", "app", "exchange", "page.tsx"), "utf8");
    expect(page).toMatch(/do not accept returns/i);
    expect(page).toMatch(/do not (give|offer) refunds/i);
    expect(page).toMatch(/exchange/i);
    expect(page).toMatch(/unable to deliver/i);
  });
});
