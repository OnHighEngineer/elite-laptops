import { getRazorpay } from "@/lib/razorpay";
import { classifyRefundError } from "@/lib/refund";
import { createAdminClient } from "@/lib/supabase/admin";

export type RefundOutcome = "processed" | "pending" | "manual";

/**
 * Refunds exactly what the customer paid online (the advance, for COD) for an order that could not be fulfilled.
 * Safe to call more than once: a payment that is already fully refunded counts as done.
 */
export async function refundOrder(orderId: string, reason: string): Promise<RefundOutcome> {
  const admin = createAdminClient();
  const { data: o } = await admin
    .from("orders")
    .select("id, status, razorpay_payment_id, amount_inr, advance_inr, payment_method, refund_status")
    .eq("id", orderId).maybeSingle();
  if (!o || !o.razorpay_payment_id) return "manual";
  if (o.refund_status === "processed") return "processed";

  const rupees = o.payment_method === "cod" ? o.advance_inr : o.amount_inr;
  if (!rupees || rupees < 1) return "manual";

  try {
    const refund = await getRazorpay().payments.refund(o.razorpay_payment_id, {
      amount: rupees * 100,
      speed: "normal",
      notes: { order_id: o.id, reason },
    });
    const status = refund.status === "processed" ? "processed" : "pending";
    await admin.from("orders").update({ refund_status: status, refund_id: refund.id, refunded_at: new Date().toISOString(), refund_note: reason }).eq("id", o.id);
    return status;
  } catch (err) {
    const kind = classifyRefundError(err);
    if (kind === "already_refunded") {
      await admin.from("orders").update({ refund_status: "processed", refund_note: "Already refunded in Razorpay" }).eq("id", o.id);
      return "processed";
    }
    await admin.from("orders").update({ refund_status: kind === "manual" ? "manual" : "failed", refund_note: reason }).eq("id", o.id);
    return "manual";
  }
}
