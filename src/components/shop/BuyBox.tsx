"use client";

import { RotateCcw, ShieldCheck, ShoppingCart, Truck, Lock } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { discountPercent } from "@/lib/product";
import { STORE_TERMS, warrantyLabel } from "@/lib/store-terms";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/data/products";

export function BuyBox({ product }: { product: Product }) {
  const { addItem } = useCart();
  const savings = discountPercent(product);

  const assurances = [
    { icon: ShieldCheck, text: warrantyLabel({ warrantyMonths: product.warrantyMonths ?? STORE_TERMS.warrantyMonths, serviceMonths: product.serviceMonths ?? STORE_TERMS.serviceMonths }) },
    { icon: RotateCcw, text: "Exchange only, no returns" },
    { icon: Truck, text: "Free shipping across India" },
    { icon: Lock, text: "Secure payments" },
  ];

  return (
    <>
      <div className="border border-[#E5E5E5] rounded-xl p-5 space-y-4">
        <div>
          <p className="text-3xl font-bold text-[#111111]">{formatPrice(product.price)}</p>
          <p className="mt-2 text-sm font-medium text-[#111111]">
            {product.inStock ? (product.stock !== undefined && product.stock <= 3 ? `Only ${product.stock} left` : "In stock") : product.stockStatus === "coming_soon" ? "Coming soon" : "Out of stock"}
          </p>
        </div>

        <button
          id="detail-add-to-cart"
          disabled={!product.inStock}
          onClick={() => addItem(product)}
          className="hidden lg:flex items-center justify-center gap-2 w-full min-h-12 bg-[#111111] text-white text-sm font-semibold rounded-xl hover:bg-[#111111]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          {product.inStock ? "Add to cart" : product.stockStatus === "coming_soon" ? "Coming soon" : "Out of stock"}
        </button>

        <ul className="space-y-2.5 pt-1">
          {assurances.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm text-[#666666]">
              <Icon className="w-4 h-4 shrink-0 text-[#111111]" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile sticky buy bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-[#E5E5E5] p-3 flex items-center justify-between gap-3">
        <p className="text-lg font-bold text-[#111111]">{formatPrice(product.price)}</p>
        <button
          id="detail-add-to-cart-mobile"
          disabled={!product.inStock}
          onClick={() => addItem(product)}
          className="flex items-center justify-center gap-2 min-h-12 px-6 bg-[#111111] text-white text-sm font-semibold rounded-xl hover:bg-[#111111]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          {product.inStock ? "Add to cart" : product.stockStatus === "coming_soon" ? "Coming soon" : "Out of stock"}
        </button>
      </div>
    </>
  );
}
