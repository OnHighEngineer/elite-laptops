import { createHmac, timingSafeEqual } from "node:crypto";
import type { Product } from "@/data/products";
import { findProduct } from "@/lib/product";
import { validateEmail } from "@/lib/auth-rules";
import { isIndianState } from "@/data/indian-states";

export const MAX_QTY = 5;

export interface OrderLine {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export type BuildOrderResult =
  | { ok: true; amountPaise: number; lines: OrderLine[] }
  | { ok: false; error: string };

/** Prices come from the server-side catalog; the client only supplies ids and quantities. */
export function buildOrder(items: { id: string; qty: number }[], catalog: Product[]): BuildOrderResult {
  if (!Array.isArray(items) || items.length === 0) return { ok: false, error: "Your cart is empty." };
  const seen = new Set<string>();
  const lines: OrderLine[] = [];
  for (const item of items) {
    if (!item || typeof item.id !== "string") return { ok: false, error: "Invalid cart." };
    if (seen.has(item.id)) return { ok: false, error: "Invalid cart." };
    seen.add(item.id);
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > MAX_QTY) {
      return { ok: false, error: `Quantity must be between 1 and ${MAX_QTY}.` };
    }
    const product = findProduct(catalog, item.id);
    if (!product) return { ok: false, error: "A product in your cart no longer exists." };
    if (!product.inStock || product.stock === 0) return { ok: false, error: `${product.name} is out of stock.` };
    if (product.stock !== undefined && item.qty > product.stock) {
      return { ok: false, error: `Only ${product.stock} of ${product.name} left in stock.` };
    }
    lines.push({ id: product.id, name: product.name, qty: item.qty, unitPrice: product.price });
  }
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  return { ok: true, amountPaise: total * 100, lines };
}

/** Razorpay: HMAC-SHA256(order_id + "|" + payment_id, key_secret), hex. */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  if (given.length !== expected.length) return false;
  return timingSafeEqual(expected, given);
}

export interface ShippingFields {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const LIMITS: Record<keyof ShippingFields, number> = {
  name: 100, email: 254, phone: 10, address: 300, city: 80, state: 60, pincode: 6,
};

/** Keeps the 10-digit Indian mobile number from "+91 98765 43210", "09876543210" and similar. */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Builds a fresh object from known keys only; non-strings become empty so nothing can throw or bloat storage. */
export function sanitizeShipping(input: unknown): ShippingFields {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const pick = (k: keyof ShippingFields) => (typeof src[k] === "string" ? (src[k] as string).trim() : "");
  return {
    name: pick("name"), email: pick("email"), phone: normalizePhone(pick("phone")), address: pick("address"),
    city: pick("city"), state: pick("state"), pincode: pick("pincode"),
  };
}

export function validateShipping(f: ShippingFields): Partial<Record<keyof ShippingFields, string>> {
  const e: Partial<Record<keyof ShippingFields, string>> = {};
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const tooLong = (k: keyof ShippingFields) => s(f[k]).length > LIMITS[k];

  if (!s(f.name) || tooLong("name")) e.name = "Please enter your name.";
  if (validateEmail(s(f.email)) || tooLong("email")) e.email = "Please enter a valid email address.";
  if (!/^[6-9]\d{9}$/.test(s(f.phone))) e.phone = "Enter a valid 10-digit mobile number.";
  if (!s(f.address) || tooLong("address")) e.address = "Please enter your address (up to 300 characters).";
  if (!s(f.city) || tooLong("city")) e.city = "Please enter your city.";
  if (!isIndianState(s(f.state))) e.state = "Please choose your state from the list.";
  if (!/^[1-9]\d{5}$/.test(s(f.pincode))) e.pincode = "Enter a valid 6-digit pincode.";
  return e;
}
