import type { OrderLine } from "@/lib/checkout";
import { STORE_GSTIN, STORE_NAME } from "@/lib/store-terms";

/** Indian financial year runs April to March. */
export function invoiceNumber(date: Date, seq: number): string {
  const y = date.getUTCFullYear();
  const startYear = date.getUTCMonth() >= 3 ? y : y - 1;
  const fy = `${startYear}-${String(startYear + 1).slice(2)}`;
  return `EL/${fy}/${String(seq).padStart(4, "0")}`;
}

const inr = (n: number) => new Intl.NumberFormat("en-IN").format(n);

export function orderEmailText(o: {
  orderId: string;
  paymentId: string;
  lines: OrderLine[];
  total: number;
  shipping: string;
  payOnline?: number;
  balanceDue?: number;
}): string {
  const rows = o.lines.map((l) => `- ${l.name} x ${l.qty}: Rs ${inr(l.unitPrice * l.qty)}`);
  return [
    "Thank you for your order at Elite Laptops.",
    "",
    ...rows,
    "",
    ...(o.balanceDue && o.balanceDue > 0
      ? [`Order total: Rs ${inr(o.total)}`, `Paid online: Rs ${inr(o.payOnline ?? 0)}`, `Pay on delivery: Rs ${inr(o.balanceDue)}`]
      : [`Total paid: Rs ${inr(o.total)}`]),
    `Order: ${o.orderId}`,
    `Payment: ${o.paymentId}`,
    "",
    `Shipping to: ${o.shipping}`,
    "",
    `Sold by: ${STORE_NAME}`,
    `GSTIN: ${STORE_GSTIN}`,
  ].join("\n");
}

export function shippedEmailText(o: {
  orderId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  shipping: string;
  balanceDue?: number;
}): string {
  return [
    "Good news: your Elite Laptops order has been shipped.",
    "",
    `Courier: ${o.courier}`,
    `Tracking number: ${o.trackingNumber}`,
    ...(o.trackingUrl ? [`Track online: ${o.trackingUrl}`] : []),
    "",
    `Delivering to: ${o.shipping}`,
    `Order: ${o.orderId}`,
    ...(o.balanceDue && o.balanceDue > 0 ? ["", `Keep Rs ${inr(o.balanceDue)} ready to pay the courier on delivery.`] : []),
    "",
    "You can also see the latest status any time under My orders on our website.",
  ].join("\n");
}

export function soldOutEmailText(o: { orderId: string; paymentId: string; total: number }): string {
  return [
    "We are sorry: the laptop you ordered sold out at the same moment your payment went through.",
    "",
    `Your payment of Rs ${inr(o.total)} will be sent back to the account you paid from, in full. This only happens because we could not deliver. It normally reaches you in 5-7 working days.`,
    `Order: ${o.orderId}`,
    `Payment: ${o.paymentId}`,
    "",
    "If you do not see it after 7 working days, please contact us through the website with your payment ID.",
  ].join("\n");
}
