import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmUrl, siteBase, unsubscribeUrl } from "@/lib/subscribe";

afterEach(() => vi.unstubAllEnvs());

describe("siteBase", () => {
  it("uses NEXT_PUBLIC_SITE_URL without a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example.com/");
    expect(siteBase()).toBe("https://shop.example.com");
  });
  it("falls back to localhost only outside production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(siteBase()).toBe("http://localhost:3000");
  });
  it("refuses to guess in production, so emails never carry a localhost link", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => siteBase()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});

describe("newsletter links", () => {
  it("point at the configured site", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example.com");
    expect(confirmUrl("a@example.com", "s".repeat(32))).toMatch(/^https:\/\/shop\.example\.com\/api\/subscribe\/confirm\?token=/);
    expect(unsubscribeUrl("a@example.com", "s".repeat(32))).toMatch(/\/api\/subscribe\/unsubscribe\?token=/);
  });
});
