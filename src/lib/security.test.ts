import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { allowRequest, detectImageType, isAdminEmail, signToken, verifyToken } from "@/lib/security";

describe("allowRequest (rate limit)", () => {
  it("allows up to the limit then blocks, per key", () => {
    const store = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) expect(allowRequest(store, "a", 3, 60_000, now)).toBe(true);
    expect(allowRequest(store, "a", 3, 60_000, now)).toBe(false);
    expect(allowRequest(store, "b", 3, 60_000, now)).toBe(true);
  });
  it("frees up after the window", () => {
    const store = new Map<string, number[]>();
    for (let i = 0; i < 3; i++) allowRequest(store, "a", 3, 60_000, 0);
    expect(allowRequest(store, "a", 3, 60_000, 60_001)).toBe(true);
  });
});

describe("detectImageType (magic bytes, not the claimed type)", () => {
  it("recognises jpeg, png, webp, gif", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(detectImageType(new TextEncoder().encode("GIF89a"))).toBe("gif");
    expect(detectImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBP"))).toBe("webp");
  });
  it("rejects html, svg, scripts and empty input", () => {
    expect(detectImageType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(detectImageType(new Uint8Array([]))).toBeNull();
  });
});

describe("isAdminEmail", () => {
  it("matches a comma list case-insensitively and rejects others", () => {
    expect(isAdminEmail("Owner@Shop.com", "owner@shop.com, boss@shop.com")).toBe(true);
    expect(isAdminEmail("hacker@evil.com", "owner@shop.com")).toBe(false);
  });
  it("is false when nothing is configured or email is missing", () => {
    expect(isAdminEmail("a@b.com", "")).toBe(false);
    expect(isAdminEmail("a@b.com", undefined)).toBe(false);
    expect(isAdminEmail(undefined, "a@b.com")).toBe(false);
  });
});

describe("signed tokens (newsletter confirm / unsubscribe)", () => {
  const secret = "s3cret";
  it("round-trips an email and purpose", () => {
    const t = signToken({ email: "a@b.com", purpose: "confirm" }, secret, 1000, 5000);
    expect(verifyToken(t, secret, "confirm", 2000)).toEqual({ email: "a@b.com" });
  });
  it("rejects wrong purpose, wrong secret, expiry and tampering", () => {
    const t = signToken({ email: "a@b.com", purpose: "confirm" }, secret, 1000, 5000);
    expect(verifyToken(t, secret, "unsubscribe", 2000)).toBeNull();
    expect(verifyToken(t, "other", "confirm", 2000)).toBeNull();
    expect(verifyToken(t, secret, "confirm", 7000)).toBeNull();
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ email: "x@y.com", purpose: "confirm", exp: 9e12 })).toString("base64url");
    expect(verifyToken(`${forged}.${sig}`, secret, "confirm", 2000)).toBeNull();
    expect(verifyToken(`${body}.${createHmac("sha256", "z").update(body).digest("base64url")}`, secret, "confirm", 2000)).toBeNull();
  });
  it("rejects garbage without throwing", () => {
    for (const g of ["", "abc", "a.b.c", ".", "%%%.%%%"]) expect(verifyToken(g, secret, "confirm", 0)).toBeNull();
  });
});
