/** Cash on delivery: the customer pays this much online now, and the rest to the courier on delivery. */
export const COD_ADVANCE_INR = 1000;

export type PaymentMethod = "online" | "cod";

export type PaymentPlan =
  | { ok: true; method: PaymentMethod; payOnlineInr: number; balanceDueInr: number }
  | { ok: false; error: string };

export function planPayment(totalInr: number, method: string): PaymentPlan {
  if (!Number.isInteger(totalInr) || totalInr < 1) return { ok: false, error: "Invalid order total." };
  if (method === "online") return { ok: true, method, payOnlineInr: totalInr, balanceDueInr: 0 };
  if (method === "cod") {
    if (totalInr <= COD_ADVANCE_INR) return { ok: false, error: "Cash on delivery is not available for this order. Please pay online." };
    return { ok: true, method, payOnlineInr: COD_ADVANCE_INR, balanceDueInr: totalInr - COD_ADVANCE_INR };
  }
  return { ok: false, error: "Choose a payment method." };
}

/** The amount Razorpay must have captured for this order, in paise. Null means the row is inconsistent. */
export function expectedPaise(o: { amount_inr: number; advance_inr: number | null; payment_method: string }): number | null {
  if (o.payment_method === "cod") return o.advance_inr && o.advance_inr > 0 ? o.advance_inr * 100 : null;
  return o.amount_inr * 100;
}
