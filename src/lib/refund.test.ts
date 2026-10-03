import { describe, expect, it } from "vitest";
import { classifyRefundError } from "@/lib/refund";

describe("classifyRefundError", () => {
  it("treats 'already fully refunded' as done (safe to repeat)", () => {
    expect(classifyRefundError({ statusCode: 400, error: { description: "The payment has been fully refunded already." } })).toBe("already_refunded");
  });
  it("needs a human when the amount or payment state is wrong", () => {
    expect(classifyRefundError({ statusCode: 400, error: { description: "The refund amount provided is greater than amount captured." } })).toBe("manual");
    expect(classifyRefundError({ statusCode: 400, error: { description: "The payment status should be captured for action to be taken." } })).toBe("manual");
  });
  it("retries on network or server trouble and on anything unknown", () => {
    expect(classifyRefundError(new Error("ECONNRESET"))).toBe("retry");
    expect(classifyRefundError({ statusCode: 502, error: { description: "Bad gateway" } })).toBe("retry");
    expect(classifyRefundError(null)).toBe("retry");
    expect(classifyRefundError("boom")).toBe("retry");
  });
});
