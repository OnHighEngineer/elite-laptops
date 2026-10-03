import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { cancelCodOrder, retryRefund } from "@/app/admin/actions";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { STATUS_LABELS, isStatus, type FulfillmentStatus } from "@/lib/fulfillment";
import { formatPrice } from "@/lib/utils";
import type { OrderLine } from "@/lib/checkout";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: Props) {
  const { id } = await params;
  if (!adminConfigured()) notFound();
  const { data: o } = await createAdminClient().from("orders").select("*").eq("id", id).maybeSingle();
  if (!o || (o.status !== "paid" && o.status !== "paid_needs_review")) notFound();

  const s = o.shipping as { name: string; email: string; phone?: string; address: string; city: string; state: string; pincode: string };
  const isCod = o.payment_method === "cod";
  const balanceDue = isCod ? o.amount_inr - (o.advance_inr ?? 0) : 0;
  const fs: FulfillmentStatus = isStatus(o.fulfillment_status) ? o.fulfillment_status : "confirmed";

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/admin/orders" className="inline-flex items-center min-h-11 text-sm underline text-[#111111]">← All orders</Link>
      <h1 className="text-2xl font-bold text-[#111111]">Order {o.razorpay_order_id}</h1>

      {o.status === "paid_needs_review" && (
        <div role="alert" className="border border-[#B00020] rounded-xl p-4 text-sm space-y-2">
          <p className="text-[#B00020]">
            The customer paid but stock ran out. Refund status: <strong>{o.refund_status ?? "not started"}</strong>
            {o.refund_note ? ` (${o.refund_note})` : ""}. Tracking is disabled for this order.
          </p>
          {o.refund_status !== "processed" && (
            <form action={retryRefund.bind(null, o.id)}>
              <button className="min-h-11 px-4 border border-[#B00020] text-[#B00020] rounded-lg text-sm font-medium hover:bg-[#F5F5F5]">Retry refund</button>
            </form>
          )}
        </div>
      )}
      {o.refund_status && o.status !== "paid_needs_review" && (
        <p className="border border-[#E5E5E5] rounded-xl p-3 text-sm text-[#666666]">Refund: {o.refund_status}{o.refund_note ? ` (${o.refund_note})` : ""}</p>
      )}

      <section className="border border-[#E5E5E5] rounded-xl p-4 space-y-1 text-sm">
        <h2 className="font-semibold text-[#111111] mb-2">Items</h2>
        {(o.lines as OrderLine[]).map((l) => (
          <p key={l.id} className="flex justify-between gap-3"><span>{l.name} × {l.qty}</span><span>{formatPrice(l.unitPrice * l.qty)}</span></p>
        ))}
        {isCod ? (
          <>
            <p className="flex justify-between gap-3 font-semibold border-t border-[#E5E5E5] pt-2 mt-2"><span>Order total</span><span>{formatPrice(o.amount_inr)}</span></p>
            <p className="flex justify-between gap-3"><span>Paid online (advance)</span><span>{formatPrice(o.advance_inr ?? 0)}</span></p>
            <p className="flex justify-between gap-3 font-semibold text-[#111111]"><span>Collect on delivery</span><span>{formatPrice(balanceDue)}</span></p>
            <p className="text-xs text-[#666666]">{o.balance_received_at ? `Balance received ${new Date(o.balance_received_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : "Balance not yet collected"}</p>
          </>
        ) : (
          <p className="flex justify-between gap-3 font-semibold border-t border-[#E5E5E5] pt-2 mt-2"><span>Total paid</span><span>{formatPrice(o.amount_inr)}</span></p>
        )}
      </section>

      <section className="border border-[#E5E5E5] rounded-xl p-4 text-sm space-y-1">
        <h2 className="font-semibold text-[#111111] mb-2">Deliver to</h2>
        <p>{s.name}</p>
        <p className="text-[#666666]">{s.address}, {s.city}, {s.state} {s.pincode}</p>
        <p className="text-[#666666] break-all">{s.email}</p>
        {s.phone && <p className="text-[#666666]">Phone: <a href={`tel:${s.phone}`} className="underline text-[#111111]">{s.phone}</a></p>}
      </section>

      {o.status === "paid" && (
        <section className="border border-[#E5E5E5] rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-[#111111] text-sm">Status: {STATUS_LABELS[fs]}</h2>
          <OrderStatusForm
            orderId={o.id}
            current={fs}
            courier={o.courier ?? ""}
            trackingNumber={o.tracking_number ?? ""}
            trackingUrl={o.tracking_url ?? ""}
            balanceDue={balanceDue}
            balanceReceived={Boolean(o.balance_received_at)}
          />
          {isCod && fs !== "delivered" && (
            <form action={cancelCodOrder.bind(null, o.id)} className="border-t border-[#E5E5E5] pt-3">
              <button className="min-h-11 px-4 border border-[#E5E5E5] rounded-lg text-sm text-[#B00020] hover:bg-[#F5F5F5]">
                Cancel order, refund the advance and restock
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
