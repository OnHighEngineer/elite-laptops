import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { allowRequest } from "@/lib/security";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

const hits = new Map<string, number[]>();
const TYPES = new Set(["view", "add_to_cart", "share"]);

export async function POST(request: Request) {
  // Counters are best effort: never block the shopper, never reveal errors.
  const ok = NextResponse.json({ ok: true });
  if (!adminConfigured()) return ok;

  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (!allowRequest(hits, ip, 60, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });

  let body: { productId?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const productId = typeof body.productId === "string" ? body.productId : "";
  const type = typeof body.type === "string" ? body.type : "";
  if (!TYPES.has(type)) return NextResponse.json({ ok: false }, { status: 400 });

  // Only real products count, so the table can't be filled with junk ids.
  const exists = (await getCatalog()).some((p) => p.id === productId);
  if (!exists) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await createAdminClient().rpc("bump_event", { p_product: productId, p_type: type });
  } catch {
    // ignore
  }
  return ok;
}
