"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { track } from "@/lib/track";

export function ShareButton({ productId, title }: { productId: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      track(productId, "share");
    } catch {
      // user cancelled the share sheet: not counted
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 min-h-11 px-4 border border-[#E5E5E5] rounded-xl text-sm font-medium text-[#111111] hover:bg-[#F5F5F5] transition-colors"
    >
      {copied ? <Check className="w-4 h-4" aria-hidden /> : <Share2 className="w-4 h-4" aria-hidden />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
