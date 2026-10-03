import { describe, expect, it } from "vitest";
import { hardenCookie } from "@/lib/supabase/cookies";

describe("hardenCookie", () => {
  it("makes the cookie HTTP-only so page scripts can never read the session", () => {
    expect(hardenCookie({}, "production").httpOnly).toBe(true);
    expect(hardenCookie({ httpOnly: false }, "development").httpOnly).toBe(true);
  });
  it("is Secure in production and allowed over http in development", () => {
    expect(hardenCookie({}, "production").secure).toBe(true);
    expect(hardenCookie({}, "development").secure).toBe(false);
  });
  it("forces SameSite=Lax", () => {
    expect(hardenCookie({ sameSite: "none" }, "production").sameSite).toBe("lax");
  });
  it("keeps lifetime and path, so sign-out (maxAge 0) and short-lived cookies still work", () => {
    expect(hardenCookie({ maxAge: 0, path: "/" }, "production")).toMatchObject({ maxAge: 0, path: "/" });
    expect(hardenCookie({ maxAge: 600 }, "production").maxAge).toBe(600);
    const expires = new Date(0);
    expect(hardenCookie({ expires }, "production").expires).toBe(expires);
  });
});
