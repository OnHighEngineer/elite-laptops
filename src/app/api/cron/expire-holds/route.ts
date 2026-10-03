import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!secret || !given.startsWith("Bearer ")) return false;
  const a = Buffer.from(given.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Vercel Cron calls this on a schedule. It frees stock held by checkouts that were never paid.
export async function GET(request: Request) {
  if (!authorized(request) || !adminConfigured()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data, error } = await createAdminClient().rpc("expire_pending_orders");
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ expired: data });
}
