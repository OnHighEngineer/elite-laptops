import { NextResponse } from "next/server";
import { validateEmail } from "@/lib/auth-rules";
import { sendEmail } from "@/lib/email";
import { allowRequest } from "@/lib/security";
import { confirmUrl } from "@/lib/subscribe";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

const hits = new Map<string, number[]>();
const SAME = { ok: true, message: "Check your inbox to confirm your subscription." };

export async function POST(request: Request) {
  const secret = process.env.NEWSLETTER_SECRET;
  if (!secret || !adminConfigured()) {
    return NextResponse.json({ error: "Signup is not available yet." }, { status: 503 });
  }
  const ip = request.headers.get("x-real-ip") ?? (request.headers.get("x-forwarded-for") ?? "unknown").split(",").pop()!.trim();
  if (!allowRequest(hits, ip, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try later." }, { status: 429 });
  }

  let body: { email?: string; website?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // Honeypot: real people never fill the hidden "website" field.
  if (body.website) return NextResponse.json(SAME);

  const email = String(body.email ?? "").trim().toLowerCase();
  if (validateEmail(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscribers").select("status, last_sent_at").eq("email", email).maybeSingle();
  // Never reveal whether an address is already on the list; never re-mail someone who unsubscribed or confirmed.
  if (!existing) await admin.from("subscribers").insert({ email });
  const recentlyMailed = existing?.last_sent_at && Date.now() - new Date(existing.last_sent_at).getTime() < 24 * 3600 * 1000;
  if ((!existing || existing.status === "pending") && !recentlyMailed) {
    await admin.from("subscribers").update({ last_sent_at: new Date().toISOString() }).eq("email", email);
    await sendEmail(
      email,
      "Confirm your Elite Laptops subscription",
      `Please confirm you want updates from Elite Laptops (new arrivals and offers).\n\nConfirm: ${confirmUrl(email, secret)}\n\nIf you did not ask for this, ignore this email and nothing will be sent.`
    );
  }
  return NextResponse.json(SAME);
}
