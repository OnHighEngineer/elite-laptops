import { describe, expect, it } from "vitest";
import { invoiceNumber, orderEmailText, shippedEmailText, soldOutEmailText } from "@/lib/orders";
import { STORE_GSTIN } from "@/lib/store-terms";

describe("invoiceNumber", () => {
  it("is stable and prefixed", () => {
    expect(invoiceNumber(new Date("2026-10-03T10:00:00Z"), 7)).toBe("EL/2026-27/0007");
    expect(invoiceNumber(new Date("2027-02-01T10:00:00Z"), 123)).toBe("EL/2026-27/0123");
  });
});

describe("orderEmailText", () => {
  it("lists lines and total", () => {
    const t = orderEmailText({
      orderId: "order_1",
      paymentId: "pay_1",
      lines: [{ id: "a", name: "HP Pavilion 15", qty: 2, unitPrice: 38999 }],
      total: 77998,
      shipping: "12 MG Road, Bengaluru, Karnataka 560057",
    });
    expect(t).toContain("HP Pavilion 15 x 2");
    expect(t).toContain("77,998");
    expect(t).toContain("pay_1");
    expect(t).toContain("12 MG Road");
    expect(t).toContain(`GSTIN: ${STORE_GSTIN}`);
    expect(t).toContain("Elite Laptops & Solutions");
  });
});

describe("COD wording", () => {
  const lines = [{ id: "a", name: "HP Pavilion 15", qty: 1, unitPrice: 38999 }];
  it("order email shows what was paid and what is due on delivery", () => {
    const t = orderEmailText({ orderId: "o", paymentId: "p", lines, total: 38999, shipping: "x", payOnline: 1000, balanceDue: 37999 });
    expect(t).toContain("Paid online: Rs 1,000");
    expect(t).toContain("Pay on delivery: Rs 37,999");
  });
  it("online-only orders do not mention delivery payment", () => {
    expect(orderEmailText({ orderId: "o", paymentId: "p", lines, total: 38999, shipping: "x" })).not.toContain("on delivery");
  });
  it("shipping email reminds the customer to keep the balance ready", () => {
    const t = shippedEmailText({ orderId: "o", courier: "DTDC", trackingNumber: "T1", trackingUrl: null, shipping: "x", balanceDue: 37999 });
    expect(t).toContain("Keep Rs 37,999 ready");
  });
});

describe("shippedEmailText", () => {
  const base = { orderId: "order_1", courier: "DTDC", trackingNumber: "D1234567890", trackingUrl: null, shipping: "12 MG Road, Bengaluru, Karnataka 560057" };
  it("tells the customer the courier and tracking number", () => {
    const t = shippedEmailText(base);
    expect(t).toContain("DTDC");
    expect(t).toContain("D1234567890");
    expect(t).toContain("12 MG Road");
    expect(t).not.toContain("Track online");
  });
  it("includes the tracking link when there is one", () => {
    expect(shippedEmailText({ ...base, trackingUrl: "https://track.example.com/x" })).toContain("Track online: https://track.example.com/x");
  });
});

describe("soldOutEmailText", () => {
  it("apologises, says the money is sent back, and quotes the ids", () => {
    const t = soldOutEmailText({ orderId: "order_1", paymentId: "pay_1", total: 38999 });
    expect(t).toContain("sold out");
    expect(t).toContain("sent back to the account you paid from, in full");
    expect(t).toContain("5-7 working days");
    expect(t).toContain("38,999");
    expect(t).toContain("pay_1");
  });
});
