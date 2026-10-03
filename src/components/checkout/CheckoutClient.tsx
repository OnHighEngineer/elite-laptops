"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { validateShipping, type ShippingFields } from "@/lib/checkout";
import { INDIAN_STATES } from "@/data/indian-states";
import { COD_ADVANCE_INR, planPayment, type PaymentMethod } from "@/lib/payment-plan";
import { formatPrice } from "@/lib/utils";

const INPUT =
  "w-full min-h-11 px-4 py-3 border border-[#E5E5E5] rounded-xl text-base text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] bg-white";
const LABEL = "block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-2";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: () => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const EMPTY: ShippingFields = { name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" };

export function CheckoutClient({ email }: { email: string }) {
  const router = useRouter();
  const { items, total } = useCart();
  const [f, setF] = useState<ShippingFields>({ ...EMPTY, email });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingFields, string>>>({});
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [message, setMessage] = useState("");

  const set = (k: keyof ShippingFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  const plan = planPayment(total, method);
  const codAvailable = planPayment(total, "cod").ok;
  const payNow = plan.ok ? plan.payOnlineInr : total;
  const balanceDue = plan.ok ? plan.balanceDueInr : 0;

  if (items.length === 0) {
    return (
      <div className="text-center space-y-4 py-10">
        <p className="text-[#666666]">Your cart is empty.</p>
        <Link href="/shop" className="inline-flex items-center justify-center min-h-12 px-8 bg-[#111111] text-white text-sm font-semibold rounded-full">
          Browse laptops
        </Link>
      </div>
    );
  }

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const found = validateShipping(f);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (!window.Razorpay) {
      setMessage("Payment is still loading. Please try again in a moment.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.product.id, qty: i.quantity })),
          shipping: f,
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not start payment.");
        setBusy(false);
        return;
      }
      const rz = new window.Razorpay!({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Elite Laptops",
        description: "Laptop order",
        prefill: { name: f.name, email: f.email },
        theme: { color: "#111111" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: RazorpayResponse) => {
          const v = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: r.razorpay_order_id,
              paymentId: r.razorpay_payment_id,
              signature: r.razorpay_signature,
            }),
          });
          if (v.ok) {
            const result = await v.json().catch(() => ({}));
            const suffix = result.soldOut ? "&soldout=1" : "";
            router.push(`/order/success?payment=${encodeURIComponent(r.razorpay_payment_id)}${suffix}`);
          } else {
            setMessage("We could not verify your payment. If money was deducted, contact support with your payment ID: " + r.razorpay_payment_id);
            setBusy(false);
          }
        },
      });
      rz.on("payment.failed", () => {
        setMessage("Payment failed. You have not been charged. Please try again.");
        setBusy(false);
      });
      rz.open();
    } catch {
      setMessage("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  const field = (k: keyof ShippingFields, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={k} className={LABEL}>{label}</label>
      <input id={k} value={f[k]} onChange={set(k)} className={INPUT} {...props} />
      {errors[k] && <p role="alert" className="mt-1.5 text-xs text-[#B00020]">{errors[k]}</p>}
    </div>
  );

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
        <form onSubmit={pay} noValidate className="lg:col-span-3 space-y-5">
          <h2 className="text-lg font-semibold text-[#111111]">Shipping details</h2>
          {field("name", "Full name", { autoComplete: "name" })}
          {field("email", "Email", { type: "email", autoComplete: "email" })}
          {field("phone", "Mobile number", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "98765 43210" })}
          {field("address", "Address", { autoComplete: "street-address" })}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field("city", "City", { autoComplete: "address-level2" })}
            <div>
              <label htmlFor="state" className={LABEL}>State</label>
              <select
                id="state"
                value={f.state}
                onChange={(e) => setF((v) => ({ ...v, state: e.target.value }))}
                autoComplete="address-level1"
                className={INPUT}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
              {errors.state && <p role="alert" className="mt-1.5 text-xs text-[#B00020]">{errors.state}</p>}
            </div>
          </div>
          {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-[#111111] mb-1">Payment</legend>
            <label className={`flex items-start gap-3 min-h-14 p-4 border rounded-xl cursor-pointer ${method === "online" ? "border-[#111111]" : "border-[#E5E5E5]"}`}>
              <input type="radio" name="method" checked={method === "online"} onChange={() => setMethod("online")} className="mt-1 w-4 h-4 accent-[#111111]" />
              <span className="text-sm">
                <span className="block font-medium text-[#111111]">Pay online now</span>
                <span className="text-[#666666]">UPI, cards or netbanking. Pay {formatPrice(total)} now.</span>
              </span>
            </label>
            <label className={`flex items-start gap-3 min-h-14 p-4 border rounded-xl ${codAvailable ? "cursor-pointer" : "opacity-50 cursor-not-allowed"} ${method === "cod" ? "border-[#111111]" : "border-[#E5E5E5]"}`}>
              <input type="radio" name="method" disabled={!codAvailable} checked={method === "cod"} onChange={() => setMethod("cod")} className="mt-1 w-4 h-4 accent-[#111111]" />
              <span className="text-sm">
                <span className="block font-medium text-[#111111]">Cash on delivery</span>
                <span className="text-[#666666]">
                  {codAvailable
                    ? `Pay ${formatPrice(COD_ADVANCE_INR)} now to confirm your order and the rest (${formatPrice(total - COD_ADVANCE_INR)}) to the courier.`
                    : "Not available for this order. Please pay online."}
                </span>
              </span>
            </label>
          </fieldset>
          {message && <p role="alert" className="text-sm text-[#B00020]">{message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 w-full min-h-12 bg-[#111111] text-white text-sm font-semibold rounded-xl hover:bg-[#111111]/85 transition-all disabled:opacity-50"
          >
            <Lock className="w-4 h-4" aria-hidden />
            {busy ? "Processing…" : `Pay ${formatPrice(payNow)} now`}
          </button>
          <p className="text-xs text-center text-[#666666]">
            Secure payment by Razorpay. UPI, cards and netbanking accepted.
          </p>
        </form>

        <aside className="lg:col-span-2 border border-[#E5E5E5] rounded-xl p-5 space-y-4 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-[#111111]">Order summary</h2>
          <ul className="divide-y divide-[#E5E5E5] text-sm">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex justify-between gap-3 py-3">
                <span className="text-[#111111]">{product.name} <span className="text-[#666666]">× {quantity}</span></span>
                <span className="font-medium text-[#111111] shrink-0">{formatPrice(product.price * quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm text-[#666666]"><span>Shipping</span><span>Free</span></div>
          <div className="flex justify-between font-semibold text-[#111111] border-t border-[#E5E5E5] pt-3">
            <span>Total</span><span>{formatPrice(total)}</span>
          </div>
          {balanceDue > 0 && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[#666666]">Pay now (advance)</span><span className="font-medium text-[#111111]">{formatPrice(payNow)}</span></div>
              <div className="flex justify-between"><span className="text-[#666666]">Pay on delivery</span><span className="font-medium text-[#111111]">{formatPrice(balanceDue)}</span></div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
