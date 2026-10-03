import { describe, expect, it } from "vitest";
import { BRANDS, laptops } from "@/data/products";
import { BRAND_LOGOS } from "@/data/brand-logos";

describe("BRAND_LOGOS", () => {
  it("has unique, non-empty names and drawable paths", () => {
    const names = BRAND_LOGOS.map((b) => b.name);
    expect(new Set(names).size).toBe(names.length);
    for (const b of BRAND_LOGOS) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.path.startsWith("M")).toBe(true);
    }
  });
  it("gives every logo a tight numeric viewBox", () => {
    for (const b of BRAND_LOGOS) expect(b.viewBox).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
  });
  it("includes every brand the shop actually sells", () => {
    const logoNames = BRAND_LOGOS.map((b) => b.name.toLowerCase());
    for (const brand of new Set([...BRANDS, ...laptops.map((p) => p.brand)])) {
      expect(logoNames).toContain(brand.toLowerCase());
    }
  });
  it("only contains plain path data (no markup that could be injected)", () => {
    for (const b of BRAND_LOGOS) expect(b.path).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s-]+$/);
  });
});
