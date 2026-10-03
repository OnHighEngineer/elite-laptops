import { describe, expect, it } from "vitest";
import { summarize } from "@/lib/analytics";

const now = new Date("2026-10-10T12:00:00Z");
const catalog = [
  { id: "a", name: "Laptop A" },
  { id: "b", name: "Laptop B" },
];
const line = (id: string, qty: number, unitPrice: number) => ({ id, name: id, qty, unitPrice });

describe("summarize", () => {
  const orders = [
    { amount_inr: 100000, paid_at: "2026-10-10T08:00:00Z", lines: [line("a", 2, 50000)] },
    { amount_inr: 50000, paid_at: "2026-10-09T08:00:00Z", lines: [line("b", 1, 50000)] },
  ];
  const events = [
    { product_id: "a", type: "view", n: 40 },
    { product_id: "a", type: "add_to_cart", n: 8 },
    { product_id: "a", type: "share", n: 3 },
    { product_id: "b", type: "view", n: 10 },
    { product_id: "ghost", type: "view", n: 99 },
  ];
  const s = summarize({ orders, events, catalog, now, days: 7 });

  it("totals revenue, orders and average", () => {
    expect(s.revenue).toBe(150000);
    expect(s.orderCount).toBe(2);
    expect(s.avgOrder).toBe(75000);
    expect(s.units).toBe(3);
  });
  it("ranks top sellers by units", () => {
    expect(s.top.map((t) => [t.id, t.units, t.revenue])).toEqual([
      ["a", 2, 100000],
      ["b", 1, 50000],
    ]);
  });
  it("joins engagement per catalog product and ignores unknown ids", () => {
    const a = s.perProduct.find((p) => p.id === "a")!;
    expect(a).toMatchObject({ views: 40, adds: 8, shares: 3, units: 2 });
    expect(s.perProduct.find((p) => p.id === "ghost")).toBeUndefined();
  });
  it("fills every day of the window with zeros", () => {
    expect(s.daily).toHaveLength(7);
    expect(s.daily[6]).toEqual({ date: "2026-10-10", revenue: 100000 });
    expect(s.daily[5]).toEqual({ date: "2026-10-09", revenue: 50000 });
    expect(s.daily[0].revenue).toBe(0);
  });
  it("handles an empty shop without dividing by zero", () => {
    const e = summarize({ orders: [], events: [], catalog, now, days: 7 });
    expect(e.revenue).toBe(0);
    expect(e.avgOrder).toBe(0);
    expect(e.top).toEqual([]);
  });
});
