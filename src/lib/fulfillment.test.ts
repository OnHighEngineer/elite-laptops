import { describe, expect, it } from "vitest";
import {
  FULFILLMENT_STATUSES,
  appendHistory,
  canTransition,
  timeline,
  validateUpdate,
  codDeliveryError,
  type HistoryEntry,
} from "@/lib/fulfillment";

describe("canTransition", () => {
  it("allows moving forward, including skipping steps", () => {
    expect(canTransition("confirmed", "packed")).toBe(true);
    expect(canTransition("confirmed", "shipped")).toBe(true);
    expect(canTransition("shipped", "delivered")).toBe(true);
  });
  it("allows undoing exactly one step (a mis-click)", () => {
    expect(canTransition("shipped", "packed")).toBe(true);
    expect(canTransition("shipped", "confirmed")).toBe(false);
  });
  it("never changes a delivered order, and ignores no-op changes", () => {
    for (const s of FULFILLMENT_STATUSES) expect(canTransition("delivered", s)).toBe(false);
    expect(canTransition("packed", "packed")).toBe(false);
  });
});

describe("appendHistory", () => {
  const t = (n: number) => new Date(2026, 9, n);
  it("adds the new status with its time", () => {
    const h = appendHistory([], "confirmed", t(1));
    expect(h).toEqual([{ status: "confirmed", at: t(1).toISOString() }]);
  });
  it("keeps earlier steps and drops later ones when undoing", () => {
    let h: HistoryEntry[] = [];
    for (const [s, d] of [["confirmed", 1], ["packed", 2], ["shipped", 3]] as const) h = appendHistory(h, s, t(d));
    const back = appendHistory(h, "packed", t(4));
    expect(back.map((e) => e.status)).toEqual(["confirmed", "packed"]);
    expect(back[1].at).toBe(t(2).toISOString());
  });
});

describe("timeline", () => {
  const history: HistoryEntry[] = [
    { status: "confirmed", at: "2026-10-01T00:00:00.000Z" },
    { status: "shipped", at: "2026-10-03T00:00:00.000Z" },
  ];
  it("marks done, current and upcoming, with times where known", () => {
    const steps = timeline("shipped", history);
    expect(steps.map((s) => s.state)).toEqual(["done", "done", "current", "upcoming", "upcoming"]);
    expect(steps[0].at).toBe("2026-10-01T00:00:00.000Z");
    expect(steps[1].at).toBeUndefined(); // skipped step has no time
    expect(steps[2].at).toBe("2026-10-03T00:00:00.000Z");
  });
  it("shows every step done once delivered", () => {
    expect(timeline("delivered", []).every((s) => s.state === "done")).toBe(true);
  });
});

describe("validateUpdate", () => {
  const ship = { status: "shipped", courier: "DTDC", trackingNumber: "D1234567890", trackingUrl: "" };
  it("accepts a shipment with courier and tracking number", () => {
    expect(validateUpdate(ship, "packed")).toEqual({
      ok: true,
      value: { status: "shipped", courier: "DTDC", trackingNumber: "D1234567890", trackingUrl: null },
    });
  });
  it("accepts an https tracking link only", () => {
    const ok = validateUpdate({ ...ship, trackingUrl: "https://track.example.com/x?id=1" }, "packed");
    expect(ok.ok && ok.value.trackingUrl).toBe("https://track.example.com/x?id=1");
    for (const bad of ["http://track.example.com", "javascript:alert(1)", "not a url", "https://" + "a".repeat(300) + ".com"]) {
      expect(validateUpdate({ ...ship, trackingUrl: bad }, "packed").ok).toBe(false);
    }
  });
  it("requires courier and tracking number from shipped onwards", () => {
    for (const status of ["shipped", "out_for_delivery", "delivered"]) {
      expect(validateUpdate({ ...ship, status, courier: "" }, "packed").ok).toBe(false);
      expect(validateUpdate({ ...ship, status, trackingNumber: " " }, "packed").ok).toBe(false);
    }
  });
  it("rejects unsafe or oversized tracking numbers and couriers", () => {
    expect(validateUpdate({ ...ship, trackingNumber: "<script>" }, "packed").ok).toBe(false);
    expect(validateUpdate({ ...ship, trackingNumber: "x".repeat(41) }, "packed").ok).toBe(false);
    expect(validateUpdate({ ...ship, courier: "c".repeat(41) }, "packed").ok).toBe(false);
  });
  it("clears courier details before shipping (e.g. after undoing a shipment)", () => {
    const r = validateUpdate({ status: "packed", courier: "DTDC", trackingNumber: "D1234567890", trackingUrl: "" }, "shipped");
    expect(r).toEqual({ ok: true, value: { status: "packed", courier: null, trackingNumber: null, trackingUrl: null } });
  });
  it("rejects unknown statuses and forbidden jumps", () => {
    expect(validateUpdate({ ...ship, status: "teleported" }, "packed").ok).toBe(false);
    expect(validateUpdate({ ...ship, status: "confirmed" }, "shipped").ok).toBe(false);
    expect(validateUpdate({ ...ship, status: "packed" }, "delivered").ok).toBe(false);
  });
});

describe("codDeliveryError", () => {
  it("a COD order cannot be marked delivered until the balance is received", () => {
    expect(codDeliveryError("cod", false)).toMatch(/balance/i);
    expect(codDeliveryError("cod", true)).toBeNull();
  });
  it("online orders have nothing to collect", () => {
    expect(codDeliveryError("online", false)).toBeNull();
    expect(codDeliveryError(undefined, false)).toBeNull();
  });
});
