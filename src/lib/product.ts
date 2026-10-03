import type { Condition, Product, SpecDetails, StockStatus } from "@/data/products";

export function discountPercent(
  p: Pick<Product, "price" | "originalPrice">
): number | null {
  if (!p.originalPrice || p.originalPrice <= p.price) return null;
  const pct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  return pct >= 1 ? pct : null;
}

const LABELS: Record<Condition, string> = {
  new: "New",
  refurbished: "Certified Refurbished",
  "open-box": "Open Box",
};

export function conditionLabel(c: Condition): string {
  return LABELS[c];
}

export function findProduct(list: Product[], id: string): Product | undefined {
  return list.find((p) => p.id === id);
}

/** "In stock" only counts when there is quantity to sell. */
export function effectiveStatus(status: StockStatus, qty: number): StockStatus {
  return status === "in_stock" && qty <= 0 ? "out_of_stock" : status;
}

export function specList(d: SpecDetails, extras: string[]): string[] {
  return [d.processor, d.ram, d.storage, d.graphics, d.screen, d.os, d.battery, ...extras].filter(Boolean);
}
