import { NextResponse } from "next/server";
import { buildOrder, sanitizeShipping, validateShipping } from "@/lib/checkout";
import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { getCatalog } from "@/lib/catalog";
import { allowRequest } from "@/lib/security";
import { planPayment } from "@/lib/payment-plan";
import { checkPincode } from "@/lib/pincode";
import { supabaseConfigured } from "@/lib/supabase/env";

const hits = new Map<string, number[]>();

export async function POST(request: Request) {
  if (!razorpayConfigured() || !supabaseConfigured() || !adminConfigured()) {
    return NextResponse.json({ error: "Checkout is not available yet." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to check out." }, { status: 401 });

  if (!allowRequest(hits, user.id, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  let body: { items?: { id: string; qty: number }[]; shipping?: unknown; paymentMethod?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const order = buildOrder(body.items ?? [], await getCatalog());
  if (!order.ok) return NextResponse.json({ error: order.error }, { status: 400 });

  const shipping = sanitizeShipping(body.shipping);
  if (Object.keys(validateShipping(shipping)).length > 0) {
    return NextResponse.json({ error: "Please check your shipping details." }, { status: 400 });
  }

  // Is this a real address? Checks that the pincode exists and belongs to the chosen state.
  const place = await checkPincode(shipping.pincode, shipping.state);
  if (place === "not_found") return NextResponse.json({ error: "That pincode does not exist. Please check it." }, { status: 400 });
  if (place === "state_mismatch") return NextResponse.json({ error: "That pincode is not in the state you chose. Please check both." }, { status: 400 });
  // "unavailable" (the free lookup is down) must not stop a sale; the other checks still apply.

  const totalInr = order.amountPaise / 100;
  const plan = planPayment(totalInr, String(body.paymentMethod ?? "online"));
  if (!plan.ok) return NextResponse.json({ error: plan.error }, { status: 400 });

  try {
    const rz = getRazorpay();
    const created = await rz.orders.create({
      amount: plan.payOnlineInr * 100,
      currency: "INR",
      receipt: `el_${Date.now()}`.slice(0, 40),
      notes: { user_id: user.id, email: user.email ?? "", method: plan.method },
    });
    // One database step creates the order and holds the stock, so two buyers cannot take the same last laptop.
    const { data: orderId, error: saveError } = await createAdminClient().rpc("create_pending_order", {
      p_user: user.id,
      p_rzp_order: created.id,
      p_lines: order.lines,
      p_amount: totalInr,
      p_shipping: shipping,
      p_method: plan.method,
      p_advance: plan.method === "cod" ? plan.payOnlineInr : null,
      p_hold_minutes: 15,
    });
    if (saveError) {
      return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
    }
    if (!orderId) {
      return NextResponse.json({ error: "Sorry, one of these laptops was just taken by another customer." }, { status: 409 });
    }
    return NextResponse.json({
      orderId: created.id,
      amount: plan.payOnlineInr * 100,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      email: user.email,
      method: plan.method,
      balanceDue: plan.balanceDueInr,
    });
  } catch {
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
