import { describe, expect, it } from "vitest";
import { passwordProblems, passwordStrength, safeNext, validateEmail } from "@/lib/auth-rules";

describe("validateEmail", () => {
  it("accepts a normal address", () => {
    expect(validateEmail("asha@example.com")).toBeNull();
  });
  it("rejects bad addresses", () => {
    expect(validateEmail("")).not.toBeNull();
    expect(validateEmail("nope")).not.toBeNull();
    expect(validateEmail("a@b")).not.toBeNull();
  });
});

describe("passwordProblems", () => {
  it("accepts a strong password", () => {
    expect(passwordProblems("Sunny-Laptop-42")).toEqual([]);
  });
  it("requires 10+ chars, upper, lower, digit", () => {
    expect(passwordProblems("short1A")).toContain("Use at least 10 characters.");
    expect(passwordProblems("alllowercase1")).toContain("Add an uppercase letter.");
    expect(passwordProblems("ALLUPPERCASE1")).toContain("Add a lowercase letter.");
    expect(passwordProblems("NoDigitsHereAtAll")).toContain("Add a number.");
  });
  it("rejects very common passwords", () => {
    expect(passwordProblems("Password123")).toContain("That password is too common.");
  });
  it("rejects more than 72 chars (bcrypt limit)", () => {
    expect(passwordProblems("Aa1" + "x".repeat(80))).toContain("Use at most 72 characters.");
  });
});

describe("passwordStrength", () => {
  it("scores 0 for empty and rises with quality", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("abc")).toBeLessThan(passwordStrength("Sunny-Laptop-42"));
    expect(passwordStrength("Sunny-Laptop-42")).toBeGreaterThanOrEqual(3);
  });
});

describe("safeNext", () => {
  it("allows same-site paths", () => {
    expect(safeNext("/account")).toBe("/account");
    expect(safeNext("/shop?q=dell")).toBe("/shop?q=dell");
  });
  it("falls back for external or malformed targets", () => {
    for (const bad of ["/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/ /evil.com", "/\u0000x", "/\u007fx", "https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined]) {
      expect(safeNext(bad)).toBe("/account");
    }
  });
});
