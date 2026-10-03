import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderEmailText, soldOutEmailText } from "@/lib/orders";
import { expectedPaise } from "@/lib/payment-plan";
import { refundOrder } from "@/lib/refund-payment";
import { sendEmail } from "@/lib/email";
import type { OrderLine } from "@/lib/checkout";

interface Shipping {
  name: string; email: string; phone?: string; address: string; city: string; state: string; pincode: string;
}

/** Marks an order paid (idempotent), then emails the customer and the store once. */
export async function finalizeOrder(rzpOrderId: string, paymentId: string, paidPaise?: number) {
  const admin = createAdminClient();
  const { data: before } = await admin
    .from("orders").select("status, amount_inr, advance_inr, payment_method").eq("razorpay_order_id", rzpOrderId).maybeSingle();
  if (!before) throw new Error("Unknown order");
  const expected = expectedPaise(before);
  if (expected === null) throw new Error("Inconsistent order");
  // Razorpay must have captured exactly what we asked for: the full total online, or the advance for COD.
  if (paidPaise !== undefined && paidPaise !== expected) {
    throw new Error("Amount mismatch");
  }
  const wasPaid = before.status === "paid" || before.status === "paid_needs_review";

  const { data: order, error } = await admin.rpc("mark_order_paid", {
    p_rzp_order: rzpOrderId,
    p_payment: paymentId,
  });
  if (error || !order) throw new Error("Could not finalize order");
  if (!wasPaid) revalidateTag(CATALOG_TAG, { expire: 0 });

  const balanceDue = order.payment_method === "cod" ? order.amount_inr - (order.advance_inr ?? 0) : 0;

  if (!wasPaid && order.status === "paid_needs_review") {
    // Sold out between checkout and payment: refund what was paid, automatically.
    const refund = await refundOrder(order.id, "Sold out before payment completed");
    const paid = order.payment_method === "cod" ? order.advance_inr ?? 0 : order.amount_inr;
    const buyer = (order.shipping as Shipping).email;
    await sendEmail(
      buyer,
      "About your Elite Laptops order",
      soldOutEmailText({ orderId: order.razorpay_order_id, paymentId, total: paid })
    );
    if (process.env.STORE_NOTIFY_EMAIL) {
      await sendEmail(
        process.env.STORE_NOTIFY_EMAIL,
        refund === "manual"
          ? `ACTION NEEDED: refund order ${order.razorpay_order_id}`
          : `Auto-refund started for sold-out order ${order.razorpay_order_id}`,
        refund === "manual"
          ? `A customer paid but stock ran out, and the automatic refund did not go through. Open the order in the admin and press "Retry refund", or refund payment ${paymentId} in the Razorpay dashboard.\nOrder: ${order.razorpay_order_id}`
          : `A customer paid after the laptop sold out. We refunded Rs ${paid} automatically (status: ${refund}).\nOrder: ${order.razorpay_order_id}\nPayment: ${paymentId}`
      );
    }
  } else if (!wasPaid) {
    const s = order.shipping as Shipping;
    const text = orderEmailText({
      orderId: order.razorpay_order_id,
      paymentId,
      lines: order.lines as OrderLine[],
      total: order.amount_inr,
      shipping: `${s.address}, ${s.city}, ${s.state} ${s.pincode}`,
      ...(balanceDue > 0 ? { payOnline: order.advance_inr ?? 0, balanceDue } : {}),
    });
    await sendEmail(s.email, "Your Elite Laptops order is confirmed", text);
    if (process.env.STORE_NOTIFY_EMAIL) {
      const storeText = balanceDue > 0
        ? `${text}\n\nCASH ON DELIVERY: collect Rs ${balanceDue} from the customer. Phone: ${s.phone ?? "not given"}`
        : text;
      await sendEmail(process.env.STORE_NOTIFY_EMAIL, `New paid order ${order.razorpay_order_id}`, storeText);
    }
  }
  return order as { id: string; razorpay_order_id: string; amount_inr: number; status: string };
}
