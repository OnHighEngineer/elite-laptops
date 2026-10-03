import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

type Props = { searchParams: Promise<{ payment?: string; soldout?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { payment, soldout } = await searchParams;
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
      {!soldout && <CheckCircle2 className="w-14 h-14 mx-auto text-[#111111]" aria-hidden />}
      {soldout ? (
        <>
          <h1 className="text-2xl font-bold text-[#111111]">Sorry, this laptop just sold out</h1>
          <p className="text-sm text-[#666666]">
            Someone else bought the last one at the same moment, so we could not deliver it. We are sending back what you paid, and we have emailed you the details.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-[#111111]">Thank you, your order is confirmed</h1>
          <p className="text-sm text-[#666666]">Your payment was received. We will email you the order details shortly.</p>
        </>
      )}
      {payment && (
        <p className="text-xs text-[#666666] break-all">Payment ID: <span className="font-mono">{payment}</span></p>
      )}
      <Link href="/orders" className="inline-flex items-center justify-center min-h-12 px-8 border border-[#E5E5E5] text-sm font-semibold text-[#111111] rounded-full hover:bg-[#F5F5F5] mr-2">
        Track your order
      </Link>
      <Link href="/shop" className="inline-flex items-center justify-center min-h-12 px-8 bg-[#111111] text-white text-sm font-semibold rounded-full">
        Continue shopping
      </Link>
    </div>
  );
}
