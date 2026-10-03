import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

// Public product data only (the same thing the shop pages show).
export async function GET() {
  const products = await getCatalog();
  return NextResponse.json(products, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}
