import type { Condition, Product, SpecDetails, StockStatus } from "@/data/products";

export function discountPercent(
  _p: Pick<Product, "price" | "originalPrice">
): number | null {
  return null;
}

const LABELS: Record<Condition, string> = {
  new: "Refurbished",
  refurbished: "Refurbished",
  "open-box": "Refurbished",
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
