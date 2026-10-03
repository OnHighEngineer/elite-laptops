import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { laptops } from "@/data/products";
import { buildOrder, validateShipping, verifyPaymentSignature } from "@/lib/checkout";

describe("buildOrder", () => {
  it("prices from the catalog in paise", () => {
    const r = buildOrder([{ id: "hp-pavilion-15", qty: 2 }], laptops);
    expect(r).toEqual({
      ok: true,
      amountPaise: 38999 * 2 * 100,
      lines: [{ id: "hp-pavilion-15", name: "HP Pavilion 15", qty: 2, unitPrice: 38999 }],
    });
  });
  it("rejects an empty cart", () => {
    expect(buildOrder([], laptops)).toMatchObject({ ok: false });
  });
  it("rejects unknown products", () => {
    expect(buildOrder([{ id: "nope", qty: 1 }], laptops)).toMatchObject({ ok: false });
  });
  it("rejects out-of-stock products", () => {
    expect(buildOrder([{ id: "dell-xps-13", qty: 1 }], laptops)).toMatchObject({ ok: false });
  });
  it("rejects bad quantities", () => {
    for (const qty of [0, -1, 1.5, 6, NaN]) {
      expect(buildOrder([{ id: "hp-pavilion-15", qty }], laptops)).toMatchObject({ ok: false });
    }
  });
  it("rejects more units than are in stock, and allows exactly what is in stock", () => {
    const catalog = laptops.map((p) => (p.id === "hp-pavilion-15" ? { ...p, stock: 2 } : p));
    expect(buildOrder([{ id: "hp-pavilion-15", qty: 3 }], catalog)).toMatchObject({ ok: false });
    expect(buildOrder([{ id: "hp-pavilion-15", qty: 2 }], catalog)).toMatchObject({ ok: true });
  });
  it("prices from the catalog it is given, not from any client value", () => {
    const catalog = laptops.map((p) => (p.id === "hp-pavilion-15" ? { ...p, price: 1000 } : p));
    expect(buildOrder([{ id: "hp-pavilion-15", qty: 1 }], catalog)).toMatchObject({ ok: true, amountPaise: 100000 });
  });
  it("rejects duplicate lines", () => {
    expect(
      buildOrder(
        [
          { id: "hp-pavilion-15", qty: 1 },
          { id: "hp-pavilion-15", qty: 1 },
        ],
        laptops
      )
    ).toMatchObject({ ok: false });
  });
});

describe("verifyPaymentSignature", () => {
  const secret = "test_secret";
  const sig = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
  it("accepts a valid signature", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", sig, secret)).toBe(true);
  });
  it("rejects a tampered payment id, order id, or signature", () => {
    expect(verifyPaymentSignature("order_1", "pay_2", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_2", "pay_1", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "00" + sig.slice(2), secret)).toBe(false);
  });
  it("rejects wrong-length or empty signatures without throwing", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", "abc", secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "", secret)).toBe(false);
  });
  it("rejects when the secret is missing", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", sig, "")).toBe(false);
  });
});

describe("validateShipping", () => {
  const ok = {
    name: "Asha Rao",
    email: "asha@example.com",
    phone: "9876543210",
    address: "12 MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560057",
  };
  it("accepts a complete address", () => {
    expect(validateShipping(ok)).toEqual({});
  });
  it("flags every missing or bad field", () => {
    const e = validateShipping({ name: " ", email: "x", phone: "12", address: "", city: "", state: "", pincode: "123" });
    expect(Object.keys(e).sort()).toEqual(["address", "city", "email", "name", "phone", "pincode", "state"]);
  });
  it("does not throw on non-string or oversized fields", () => {
    const e = validateShipping({ ...ok, name: 1 as never, address: "A".repeat(301), city: null as never });
    expect(e.name).toBeDefined();
    expect(e.address).toBeDefined();
    expect(e.city).toBeDefined();
  });
  it("sanitizeShipping keeps only known string keys", async () => {
    const { sanitizeShipping } = await import("@/lib/checkout");
    const out = sanitizeShipping({ ...ok, junk: { a: 1 }, name: "  Asha  " } as never);
    expect(Object.keys(out).sort()).toEqual(["address", "city", "email", "name", "phone", "pincode", "state"]);
    expect(out.name).toBe("Asha");
  });
  it("rejects a misspelled or unknown state", () => {
    expect(validateShipping({ ...ok, state: "Karnatka" }).state).toBeDefined();
    expect(validateShipping({ ...ok, state: "Maharashtra" }).state).toBeUndefined();
  });
  it("accepts Indian mobile numbers written the usual ways and normalises them", async () => {
    const { sanitizeShipping } = await import("@/lib/checkout");
    for (const raw of ["9876543210", "+91 98765 43210", "09876543210", "91-9876543210", " 98765-43210 "]) {
      const out = sanitizeShipping({ ...ok, phone: raw });
      expect(out.phone).toBe("9876543210");
      expect(validateShipping(out).phone).toBeUndefined();
    }
  });
  it("rejects numbers that cannot be a mobile", () => {
    for (const bad of ["", "12345", "5876543210", "98765432100", "abcdefghij"]) {
      expect(validateShipping({ ...ok, phone: bad }).phone).toBeDefined();
    }
  });
  it("requires a 6-digit pincode not starting with 0", () => {
    expect(validateShipping({ ...ok, pincode: "060057" }).pincode).toBeDefined();
    expect(validateShipping({ ...ok, pincode: "56005a" }).pincode).toBeDefined();
  });
});
