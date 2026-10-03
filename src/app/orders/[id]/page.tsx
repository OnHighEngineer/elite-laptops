import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { TrackingTimeline } from "@/components/orders/TrackingTimeline";
import { isStatus, type FulfillmentStatus, type HistoryEntry } from "@/lib/fulfillment";
import { invoiceNumber } from "@/lib/orders";
import { STORE_ADDRESS, STORE_GSTIN, STORE_NAME } from "@/lib/store-terms";
import { formatPrice } from "@/lib/utils";
import type { OrderLine } from "@/lib/checkout";

export const metadata: Metadata = { title: "Order receipt", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  if (!supabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/orders/${encodeURIComponent(id)}`);

  // RLS limits this to the signed-in customer's own orders.
  const { data: o } = await supabase.from("orders").select("*").eq("id", id).eq("user_id", user.id).eq("status", "paid").maybeSingle();
  if (!o) notFound();

  const s = o.shipping as { name: string; address: string; city: string; state: string; pincode: string };
  const lines = o.lines as OrderLine[];
  const fs: FulfillmentStatus = isStatus(o.fulfillment_status) ? o.fulfillment_status : "confirmed";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 text-sm">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Your order</h1>
          <p className="text-[#666666]">{invoiceNumber(new Date(o.paid_at ?? o.created_at), Number(o.invoice_seq ?? 0))}</p>
          <p className="text-[#666666]">{new Date(o.paid_at ?? o.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        </div>
        <div className="sm:text-right">
          <p className="font-semibold text-[#111111]">{STORE_NAME}</p>
          <p className="text-[#666666]">GSTIN: {STORE_GSTIN}</p>
          <p className="text-[#666666] max-w-[16rem] sm:ml-auto">{STORE_ADDRESS}</p>
        </div>
      </div>
      <TrackingTimeline
        status={fs}
        history={(o.status_history as HistoryEntry[]) ?? []}
        courier={o.courier}
        trackingNumber={o.tracking_number}
        trackingUrl={o.tracking_url}
      />
      <div>
        <p className="text-xs uppercase tracking-wider text-[#666666]">Billed to</p>
        <p className="text-[#111111]">{s.name}</p>
        <p className="text-[#666666]">{s.address}, {s.city}, {s.state} {s.pincode}</p>
      </div>
      <table className="w-full">
        <thead><tr className="text-left text-[#666666] border-b border-[#E5E5E5]"><th className="py-2">Item</th><th>Qty</th><th className="text-right">Amount</th></tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b border-[#E5E5E5]">
              <td className="py-2 pr-2">{l.name}</td><td>{l.qty}</td>
              <td className="text-right">{formatPrice(l.unitPrice * l.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto max-w-xs">
        {o.payment_method === "cod" ? (
          <>
            <div className="flex justify-between font-semibold text-[#111111] pt-2"><dt>Order total</dt><dd>{formatPrice(o.amount_inr)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#666666]">Paid online (advance)</dt><dd>{formatPrice(o.advance_inr ?? 0)}</dd></div>
            <div className="flex justify-between font-medium text-[#111111]"><dt>{o.balance_received_at ? "Paid on delivery" : "Pay on delivery"}</dt><dd>{formatPrice(o.amount_inr - (o.advance_inr ?? 0))}</dd></div>
          </>
        ) : (
          <div className="flex justify-between font-semibold text-[#111111] pt-2"><dt>Total paid</dt><dd>{formatPrice(o.amount_inr)}</dd></div>
        )}
      </dl>
    </div>
  );
}
