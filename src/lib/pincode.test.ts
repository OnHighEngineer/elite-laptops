import { describe, expect, it, vi } from "vitest";
import { checkPincode, normalizeState, parsePincodeResponse, stateMatches } from "@/lib/pincode";

const ok560057 = [{ Status: "Success", PostOffice: [{ State: "Karnataka" }, { State: "Karnataka" }] }];

describe("normalizeState", () => {
  it("lowercases, trims and turns & into and", () => {
    expect(normalizeState("  Jammu & Kashmir ")).toBe("jammu and kashmir");
    expect(normalizeState("Tamil   Nadu")).toBe("tamil nadu");
  });
});

describe("stateMatches (India Post spells some states differently)", () => {
  it("accepts the same state", () => expect(stateMatches("Karnataka", ["Karnataka"])).toBe(true));
  it("maps Puducherry / Pondicherry", () => expect(stateMatches("Puducherry", ["Pondicherry"])).toBe(true));
  it("maps Ladakh and Jammu and Kashmir to India Post's single J&K", () => {
    expect(stateMatches("Ladakh", ["Jammu & Kashmir"])).toBe(true);
    expect(stateMatches("Jammu and Kashmir", ["Jammu & Kashmir"])).toBe(true);
  });
  it("maps the Andaman and Daman unions", () => {
    expect(stateMatches("Andaman and Nicobar Islands", ["Andaman & Nicobar"])).toBe(true);
    expect(stateMatches("Dadra and Nagar Haveli and Daman and Diu", ["Daman & Diu"])).toBe(true);
    expect(stateMatches("Dadra and Nagar Haveli and Daman and Diu", ["Dadra & Nagar Haveli", "Gujarat"])).toBe(true);
  });
  it("accepts when ANY listed post office is in the chosen state", () => {
    expect(stateMatches("Gujarat", ["Dadra & Nagar Haveli", "Gujarat"])).toBe(true);
  });
  it("rejects a different state", () => {
    expect(stateMatches("Delhi", ["Karnataka"])).toBe(false);
    expect(stateMatches("Karnataka", [])).toBe(false);
  });
});

describe("parsePincodeResponse", () => {
  it("returns the states for a real pincode", () => {
    expect(parsePincodeResponse(ok560057)).toEqual({ ok: true, states: ["Karnataka"] });
  });
  it("detects unknown pincodes", () => {
    expect(parsePincodeResponse([{ Status: "Error", Message: "No records found", PostOffice: null }])).toEqual({ ok: false, reason: "not_found" });
    expect(parsePincodeResponse([{ Status: "404", Message: "The requested resource is not found" }])).toEqual({ ok: false, reason: "not_found" });
  });
  it("treats garbage as the service being unavailable", () => {
    for (const bad of [null, undefined, "x", [], {}, [{}], [{ Status: "Success", PostOffice: "nope" }]]) {
      expect(parsePincodeResponse(bad)).toEqual({ ok: false, reason: "unavailable" });
    }
  });
});

describe("checkPincode", () => {
  const fetcher = (body: unknown) => vi.fn(async () => body);
  it("ok when the pincode exists in the chosen state", async () => {
    expect(await checkPincode("560057", "Karnataka", fetcher(ok560057))).toBe("ok");
  });
  it("state_mismatch when it belongs elsewhere", async () => {
    expect(await checkPincode("560057", "Delhi", fetcher(ok560057))).toBe("state_mismatch");
  });
  it("not_found for unknown pincodes", async () => {
    expect(await checkPincode("999999", "Delhi", fetcher([{ Status: "Error", Message: "No records found", PostOffice: null }]))).toBe("not_found");
  });
  it("not_found without calling the network for malformed pincodes", async () => {
    const f = fetcher(ok560057);
    for (const bad of ["12345", "1234567", "abcdef", "060057", ""]) expect(await checkPincode(bad, "Karnataka", f)).toBe("not_found");
    expect(f).not.toHaveBeenCalled();
  });
  it("unavailable when the lookup throws or returns junk", async () => {
    expect(await checkPincode("560057", "Karnataka", vi.fn(async () => { throw new Error("timeout"); }))).toBe("unavailable");
    expect(await checkPincode("560057", "Karnataka", fetcher("<html>"))).toBe("unavailable");
  });
});
