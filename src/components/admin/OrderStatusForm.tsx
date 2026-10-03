"use client";

import { useActionState, useState } from "react";
import { updateOrderStatus, type OrderUpdateState } from "@/app/admin/actions";
import { FULFILLMENT_STATUSES, STATUS_LABELS, canTransition, type FulfillmentStatus } from "@/lib/fulfillment";

const INPUT =
  "w-full min-h-11 px-3 border border-[#E5E5E5] rounded-lg text-base text-[#111111] bg-white focus:outline-none focus:ring-1 focus:ring-[#111111]";

export function OrderStatusForm({
  orderId, current, courier, trackingNumber, trackingUrl, balanceDue, balanceReceived,
}: { orderId: string; current: FulfillmentStatus; courier: string; trackingNumber: string; trackingUrl: string; balanceDue: number; balanceReceived: boolean }) {
  const [state, action, pending] = useActionState<OrderUpdateState, FormData>(updateOrderStatus.bind(null, orderId), undefined);
  const [status, setStatus] = useState<FulfillmentStatus>(current);
  const err = state?.errors ?? {};
  const needsTracking = FULFILLMENT_STATUSES.indexOf(status) >= FULFILLMENT_STATUSES.indexOf("shipped");
  const options = FULFILLMENT_STATUSES.filter((s) => s === current || canTransition(current, s));

  if (current === "delivered") {
    return <p className="text-sm text-[#666666]">Delivered. This order is complete.</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor={`status-${orderId}`} className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-1.5">Status</label>
        <select id={`status-${orderId}`} name="status" value={status} onChange={(e) => setStatus(e.target.value as FulfillmentStatus)} className={INPUT}>
          {options.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        {err.status && <p role="alert" className="mt-1 text-xs text-[#B00020]">{err.status}</p>}
      </div>

      {needsTracking && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`courier-${orderId}`} className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-1.5">Courier</label>
            <input id={`courier-${orderId}`} name="courier" defaultValue={courier} placeholder="DTDC" className={INPUT} />
            {err.courier && <p role="alert" className="mt-1 text-xs text-[#B00020]">{err.courier}</p>}
          </div>
          <div>
            <label htmlFor={`tn-${orderId}`} className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-1.5">Tracking number</label>
            <input id={`tn-${orderId}`} name="trackingNumber" defaultValue={trackingNumber} placeholder="D1234567890" className={INPUT} />
            {err.trackingNumber && <p role="alert" className="mt-1 text-xs text-[#B00020]">{err.trackingNumber}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={`tu-${orderId}`} className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-1.5">Tracking link (optional)</label>
            <input id={`tu-${orderId}`} name="trackingUrl" defaultValue={trackingUrl} placeholder="https://..." className={INPUT} />
            {err.trackingUrl && <p role="alert" className="mt-1 text-xs text-[#B00020]">{err.trackingUrl}</p>}
          </div>
        </div>
      )}

      {balanceDue > 0 && !balanceReceived && status === "delivered" && (
        <label className="flex items-start gap-2.5 min-h-11 text-sm text-[#111111]">
          <input type="checkbox" name="balanceReceived" className="mt-1 w-4 h-4 accent-[#111111]" />
          <span>Balance received from the courier: <strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(balanceDue)}</strong></span>
        </label>
      )}
      {err.balanceReceived && <p role="alert" className="text-xs text-[#B00020]">{err.balanceReceived}</p>}
      {state?.error && <p role="alert" className="text-sm text-[#B00020]">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-[#111111]">Saved.</p>}
      <button type="submit" disabled={pending} className="min-h-11 px-6 bg-[#111111] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
        {pending ? "Saving…" : "Update status"}
      </button>
    </form>
  );
}
