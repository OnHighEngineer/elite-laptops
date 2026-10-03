import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/checkout";
import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { finalizeOrder } from "@/lib/finalize-order";
import { allowRequest } from "@/lib/security";

const hits = new Map<string, number[]>();
import { supabaseConfigured } from "@/lib/supabase/env";

export async function POST(request: Request) {
  if (!razorpayConfigured() || !supabaseConfigured() || !adminConfigured()) {
    return NextResponse.json({ error: "Checkout is not available yet." }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  if (!allowRequest(hits, user.id, 20, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  let body: { orderId?: string; paymentId?: string; signature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const valid = verifyPaymentSignature(
    String(body.orderId ?? ""),
    String(body.paymentId ?? ""),
    String(body.signature ?? ""),
    process.env.RAZORPAY_KEY_SECRET ?? ""
  );
  if (!valid) return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });

  const orderId = String(body.orderId);
  const { data: row } = await createAdminClient()
    .from("orders").select("user_id").eq("razorpay_order_id", orderId).maybeSingle();
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  try {
    // The signature only proves Razorpay issued this payment id; confirm it was actually captured for our amount.
    const payment = await getRazorpay().payments.fetch(String(body.paymentId));
    if (payment.order_id !== orderId || payment.status !== "captured" || payment.currency !== "INR") {
      return NextResponse.json({ error: "Payment is not confirmed yet. If you were charged, we will email you shortly." }, { status: 409 });
    }
    const order = await finalizeOrder(orderId, String(body.paymentId), Number(payment.amount));
    if (order.status === "paid_needs_review") {
      return NextResponse.json({ ok: true, orderId: order.id, soldOut: true });
    }
    return NextResponse.json({ ok: true, orderId: order.id });
  } catch {
    return NextResponse.json({ error: "Could not record your order. Contact support with your payment ID." }, { status: 500 });
  }
}
