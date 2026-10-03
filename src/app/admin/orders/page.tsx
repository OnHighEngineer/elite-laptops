import Link from "next/link";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { STATUS_LABELS, isStatus, type FulfillmentStatus } from "@/lib/fulfillment";
import { formatPrice } from "@/lib/utils";
import type { OrderLine } from "@/lib/checkout";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ show?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  if (!adminConfigured()) return <p className="text-sm text-[#666666]">Database is not configured yet. See docs/SETUP.md.</p>;
  const { show } = await searchParams;
  const filter = show === "all" ? "all" : show === "delivered" ? "delivered" : "open";

  let query = createAdminClient()
    .from("orders")
    .select("id, razorpay_order_id, status, fulfillment_status, amount_inr, lines, shipping, created_at, paid_at, tracking_number, payment_method, advance_inr, refund_status")
    .in("status", ["paid", "paid_needs_review"])
    .order("paid_at", { ascending: false })
    .limit(200);
  if (filter === "delivered") query = query.eq("fulfillment_status", "delivered");
  if (filter === "open") query = query.neq("fulfillment_status", "delivered");
  const { data: orders, error } = await query;
  if (error) return <p className="text-sm text-[#B00020]">Run supabase/schema.sql first, then reload.</p>;

  const tab = (value: string, label: string) => (
    <Link href={value === "open" ? "/admin/orders" : `/admin/orders?show=${value}`}
      className={`inline-flex items-center min-h-11 px-4 rounded-full text-sm border ${filter === value ? "bg-[#111111] text-white border-[#111111]" : "border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5]"}`}>
      {label}
    </Link>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-[#111111]">Orders</h1>
      <div className="flex flex-wrap gap-2">{tab("open", "To fulfil")}{tab("delivered", "Delivered")}{tab("all", "All")}</div>
      {orders.length === 0 ? (
        <p className="text-sm text-[#666666]">No orders here yet.</p>
      ) : (
        <ul className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-xl">
          {orders.map((o) => {
            const sh = o.shipping as { name: string; city: string; state: string };
            const fs: FulfillmentStatus = isStatus(o.fulfillment_status) ? o.fulfillment_status : "confirmed";
            return (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-[#F5F5F5]">
                  <div className="min-w-0">
                    <p className="font-medium text-[#111111] truncate">
                      {(o.lines as OrderLine[]).map((l) => `${l.name} × ${l.qty}`).join(", ")}
                    </p>
                    <p className="text-xs text-[#666666]">
                      {sh.name}, {sh.city}, {sh.state} · {o.paid_at ? new Date(o.paid_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : ""}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-[#111111]">{formatPrice(o.amount_inr)}{o.payment_method === "cod" ? <span className="ml-2 text-xs font-medium border border-[#111111] rounded px-1.5 py-0.5">COD · collect {formatPrice(o.amount_inr - (o.advance_inr ?? 0))}</span> : null}</p>
                    {o.status === "paid_needs_review"
                      ? <p className="text-xs font-medium text-[#B00020]">Sold out · refund {o.refund_status ?? "pending"}</p>
                      : <p className="text-xs text-[#666666]">{STATUS_LABELS[fs]}{o.tracking_number ? ` · ${o.tracking_number}` : ""}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
