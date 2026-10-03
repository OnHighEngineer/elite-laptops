import { describe, expect, it } from "vitest";
import { parseCart, serializeCart } from "@/lib/cart-storage";

const known = (id: string) => id === "hp-pavilion-15" || id === "hp-elitebook-840";

describe("cart storage", () => {
  it("round-trips ids and quantities", () => {
    const raw = serializeCart([{ id: "hp-pavilion-15", qty: 2 }]);
    expect(parseCart(raw, known)).toEqual([{ id: "hp-pavilion-15", qty: 2 }]);
  });
  it("returns an empty cart for null, junk or wrong shapes", () => {
    for (const raw of [null, "", "not json", "{}", "123", '{"a":1}']) {
      expect(parseCart(raw, known)).toEqual([]);
    }
  });
  it("drops unknown products, bad quantities and duplicates", () => {
    const raw = JSON.stringify([
      { id: "nope", qty: 1 },
      { id: "hp-pavilion-15", qty: 0 },
      { id: "hp-pavilion-15", qty: 99 },
      { id: "hp-elitebook-840", qty: 2 },
      { id: "hp-elitebook-840", qty: 1 },
      null,
      { id: 5, qty: 1 },
    ]);
    expect(parseCart(raw, known)).toEqual([
      { id: "hp-pavilion-15", qty: 5 },
      { id: "hp-elitebook-840", qty: 2 },
    ]);
  });
});
