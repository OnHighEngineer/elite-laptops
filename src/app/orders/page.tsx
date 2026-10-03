import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { formatPrice } from "@/lib/utils";
import type { OrderLine } from "@/lib/checkout";
import { STATUS_LABELS, isStatus } from "@/lib/fulfillment";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default async function OrdersPage() {
  if (!supabaseConfigured()) redirect("/login?next=/orders");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, amount_inr, lines, created_at, fulfillment_status, tracking_number")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight mb-6">My orders</h1>
      {!orders || orders.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-[#666666]">You have no orders yet.</p>
          <Link href="/shop" className="inline-flex items-center justify-center min-h-12 px-8 bg-[#111111] text-white text-sm font-semibold rounded-full">
            Browse laptops
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="border border-[#E5E5E5] rounded-xl p-4 sm:p-5 space-y-2">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-[#666666]">{new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                <span className="font-semibold text-[#111111]">{formatPrice(o.amount_inr)}</span>
              </div>
              <ul className="text-sm text-[#111111]">
                {(o.lines as OrderLine[]).map((l) => (
                  <li key={l.id}>{l.name} <span className="text-[#666666]">× {l.qty}</span></li>
                ))}
              </ul>
              <p className="text-sm font-medium text-[#111111]">
                {STATUS_LABELS[isStatus(o.fulfillment_status) ? o.fulfillment_status : "confirmed"]}
                {o.tracking_number && <span className="font-normal text-[#666666]"> · Tracking {o.tracking_number}</span>}
              </p>
              <Link href={`/orders/${o.id}`} className="inline-flex items-center min-h-11 text-sm font-medium text-[#111111] underline">
                Track order and view receipt
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
