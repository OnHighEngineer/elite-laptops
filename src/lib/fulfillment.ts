export const FULFILLMENT_STATUSES = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const STATUS_LABELS: Record<FulfillmentStatus, string> = {
  confirmed: "Order confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

export interface HistoryEntry {
  status: FulfillmentStatus;
  at: string;
}

const idx = (s: string) => FULFILLMENT_STATUSES.indexOf(s as FulfillmentStatus);
const SHIPPED_AT = idx("shipped");

export function isStatus(s: unknown): s is FulfillmentStatus {
  return typeof s === "string" && idx(s) >= 0;
}

/** Forward to any later step; back by exactly one step to fix a mis-click. Delivered is final. */
export function canTransition(from: FulfillmentStatus, to: FulfillmentStatus): boolean {
  if (from === "delivered" || from === to) return false;
  const d = idx(to) - idx(from);
  return d > 0 || d === -1;
}

export function appendHistory(history: HistoryEntry[], status: FulfillmentStatus, now: Date = new Date()): HistoryEntry[] {
  const kept = history.filter((e) => idx(e.status) <= idx(status));
  if (kept.some((e) => e.status === status)) return kept;
  return [...kept, { status, at: now.toISOString() }];
}

export interface TimelineStep {
  status: FulfillmentStatus;
  label: string;
  state: "done" | "current" | "upcoming";
  at?: string;
}

export function timeline(current: FulfillmentStatus, history: HistoryEntry[]): TimelineStep[] {
  return FULFILLMENT_STATUSES.map((status, i) => ({
    status,
    label: STATUS_LABELS[status],
    state: current === "delivered" || i < idx(current) ? "done" : i === idx(current) ? "current" : "upcoming",
    at: history.find((h) => h.status === status)?.at,
  }));
}

export interface UpdateValue {
  status: FulfillmentStatus;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

export type UpdateResult = { ok: true; value: UpdateValue } | { ok: false; errors: Record<string, string> };

/** Validates what the admin typed. Tracking details are only kept from "shipped" onwards. */
export function validateUpdate(
  input: { status?: string; courier?: string; trackingNumber?: string; trackingUrl?: string },
  current: FulfillmentStatus
): UpdateResult {
  const errors: Record<string, string> = {};
  if (!isStatus(input.status)) return { ok: false, errors: { status: "Choose a valid status." } };
  const status = input.status;
  if (!canTransition(current, status)) {
    return { ok: false, errors: { status: "That status change is not allowed." } };
  }
  if (idx(status) < SHIPPED_AT) {
    return { ok: true, value: { status, courier: null, trackingNumber: null, trackingUrl: null } };
  }

  const courier = (input.courier ?? "").trim();
  const trackingNumber = (input.trackingNumber ?? "").trim();
  const rawUrl = (input.trackingUrl ?? "").trim();

  if (!courier || courier.length > 40 || !/^[A-Za-z0-9 .&-]+$/.test(courier)) errors.courier = "Enter the courier name (for example DTDC).";
  if (!trackingNumber || trackingNumber.length > 40 || !/^[A-Za-z0-9 _/-]+$/.test(trackingNumber)) {
    errors.trackingNumber = "Enter the tracking number (letters and numbers only, up to 40).";
  }
  let trackingUrl: string | null = null;
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.protocol !== "https:" || rawUrl.length > 300) throw new Error();
      trackingUrl = u.toString();
    } catch {
      errors.trackingUrl = "Tracking link must be a full https:// address, or left blank.";
    }
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { status, courier, trackingNumber, trackingUrl } };
}

/** A cash-on-delivery order can only be completed once the courier has handed over the balance. */
export function codDeliveryError(method: string | null | undefined, balanceReceived: boolean): string | null {
  if (method === "cod" && !balanceReceived) {
    return "Tick \"Balance received\" first: this is a cash on delivery order and the balance has not been collected.";
  }
  return null;
}
