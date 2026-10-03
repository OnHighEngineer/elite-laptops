export const CART_KEY = "elite-cart-v1";
const MAX_QTY = 5;

export interface StoredLine {
  id: string;
  qty: number;
}

export function serializeCart(lines: StoredLine[]): string {
  return JSON.stringify(lines);
}

/** Reads untrusted storage: unknown products, bad quantities and duplicates are dropped. */
export function parseCart(raw: string | null, isKnown: (id: string) => boolean): StoredLine[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const out: StoredLine[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const { id, qty } = entry as { id?: unknown; qty?: unknown };
    if (typeof id !== "string" || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) continue;
    if (seen.has(id) || !isKnown(id)) continue;
    seen.add(id);
    out.push({ id, qty: Math.min(qty, MAX_QTY) });
  }
  return out;
}
