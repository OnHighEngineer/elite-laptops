import { describe, expect, it } from "vitest";
import { COD_ADVANCE_INR, planPayment } from "@/lib/payment-plan";

describe("planPayment", () => {
  it("online: the customer pays everything now", () => {
    expect(planPayment(50000, "online")).toEqual({ ok: true, method: "online", payOnlineInr: 50000, balanceDueInr: 0 });
  });
  it("cod: a fixed advance now, the rest on delivery", () => {
    expect(COD_ADVANCE_INR).toBe(1000);
    expect(planPayment(50000, "cod")).toEqual({ ok: true, method: "cod", payOnlineInr: 1000, balanceDueInr: 49000 });
  });
  it("cod needs a balance: orders at or below the advance must be paid online", () => {
    expect(planPayment(1000, "cod").ok).toBe(false);
    expect(planPayment(999, "cod").ok).toBe(false);
    expect(planPayment(1001, "cod")).toMatchObject({ ok: true, payOnlineInr: 1000, balanceDueInr: 1 });
  });
  it("rejects unknown methods and bad totals", () => {
    expect(planPayment(5000, "crypto").ok).toBe(false);
    expect(planPayment(0, "online").ok).toBe(false);
    expect(planPayment(-5, "online").ok).toBe(false);
    expect(planPayment(10.5, "online").ok).toBe(false);
  });
  it("online and cod parts always add up to the total", () => {
    for (const t of [1001, 38999, 74999]) {
      const p = planPayment(t, "cod");
      if (p.ok) expect(p.payOnlineInr + p.balanceDueInr).toBe(t);
    }
  });
});
