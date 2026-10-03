"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

export function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    try {
      const key = `viewed:${productId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked: count the view anyway
    }
    track(productId, "view");
  }, [productId]);
  return null;
}
