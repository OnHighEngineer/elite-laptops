"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Only the digest is logged: it lets you find the full server error without exposing details to the page.
    console.error("Page error", error.digest);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
      <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Something went wrong</h1>
      <p className="text-sm text-[#666666]">
        We could not load this page. Please try again, or head back to the shop.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex items-center justify-center min-h-12 px-8 bg-[#111111] text-white text-sm font-semibold rounded-full hover:bg-[#111111]/85 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center min-h-12 px-8 border border-[#E5E5E5] text-sm font-semibold text-[#111111] rounded-full hover:bg-[#F5F5F5] transition-colors"
        >
          Browse laptops
        </Link>
      </div>
      {error.digest && <p className="text-xs text-[#999999]">Reference: {error.digest}</p>}
    </div>
  );
}
