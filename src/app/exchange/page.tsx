import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";
import { STORE_TERMS } from "@/lib/store-terms";

export const metadata: Metadata = {
  title: "Exchange Policy",
  description: "Elite Laptops offers exchange only. We do not accept returns or give refunds.",
};

export default function ExchangePolicyPage() {
  return (
    <PolicyPage title="Exchange Policy">
      <p>
        <strong className="text-[#111111]">We do not accept returns and we do not give refunds.</strong> If something is
        wrong with your laptop, we offer an <strong className="text-[#111111]">exchange</strong>.
      </p>
      <p>
        If the laptop you receive is damaged, not as described, or has a fault, tell us within{" "}
        <strong className="text-[#111111]">{STORE_TERMS.exchangeDays} days</strong> of receiving it. Send a message from the
        contact page with your order details and photos or a short video of the problem. After we check it, we will
        exchange it for the same model or another laptop of equal value.
      </p>
      <p>
        Faults that appear later are covered by your warranty. See the Warranty Policy for what is included.
      </p>
      <h2 className="text-base font-semibold text-[#111111] pt-2">What is not covered</h2>
      <p>
        Exchanges are not available for a change of mind, or for physical or liquid damage that happened after delivery.
      </p>
      <h2 className="text-base font-semibold text-[#111111] pt-2">If we are unable to deliver</h2>
      <p>
        If a laptop sells out while you are paying, or we are otherwise unable to deliver your order, we will cancel it and
        send back what you paid to the same account. This is not a return. It only happens when we cannot supply the item.
        Refunds normally reach you in 5-7 working days.
      </p>
      <p>
        Cash on delivery orders: the advance you pay online confirms your order. If you refuse to accept a delivered order,
        the advance is not refunded.
      </p>
    </PolicyPage>
  );
}
