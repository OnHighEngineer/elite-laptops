import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminConfigured } from "@/lib/supabase/admin";
import { finalizeOrder } from "@/lib/finalize-order";

function validSignature(raw: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  const given = Buffer.from(signature, "hex");
  return given.length === expected.length && timingSafeEqual(expected, given);
}

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret || !adminConfigured()) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-razorpay-signature") ?? "", secret)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad body." }, { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const p = event.payload?.payment?.entity;
    if (p?.id && p.order_id && p.status === "captured") {
      try {
        await finalizeOrder(p.order_id, p.id, p.amount);
      } catch {
        // Non-200 makes Razorpay retry the webhook.
        return NextResponse.json({ error: "Retry." }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
