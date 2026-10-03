import { describe, expect, it } from "vitest";
import { expectedPaise } from "@/lib/payment-plan";

describe("expectedPaise (what Razorpay must have captured)", () => {
  it("online orders: the full total", () => {
    expect(expectedPaise({ amount_inr: 38999, advance_inr: null, payment_method: "online" })).toBe(3899900);
  });
  it("COD orders: only the advance, never the full total", () => {
    expect(expectedPaise({ amount_inr: 50000, advance_inr: 1000, payment_method: "cod" })).toBe(100000);
  });
  it("a COD order with a missing advance is treated as invalid, not as full payment", () => {
    expect(expectedPaise({ amount_inr: 50000, advance_inr: null, payment_method: "cod" })).toBeNull();
  });
});
