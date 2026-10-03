"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, ShoppingCart } from "lucide-react";
import { TiltCard } from "@/components/motion/tilt-card";
import { ConditionBadge } from "@/components/shop/ConditionBadge";
import { useCart } from "@/lib/cart-context";
import { discountPercent } from "@/lib/product";
import { STORE_TERMS, warrantyLabel } from "@/lib/store-terms";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const savings = discountPercent(product);

  return (
    <TiltCard className="flex flex-col h-full border border-[#E5E5E5] rounded-xl bg-white overflow-hidden shadow-xs hover:border-[#111111] transition-all">
      {/* Product Image */}
      <Link href={`/shop/${product.id}`} className="block">
        <div className="aspect-[4/3] bg-[#F5F5F5] overflow-hidden relative group">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width:1280px) 33vw, (min-width:640px) 50vw, 100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
          <ConditionBadge condition={product.condition} />
          {savings !== null && (
            <span className="text-xs font-semibold text-[#111111]">{savings}% off</span>
          )}
          {!product.inStock && (
            <span className="text-xs text-[#999999] ml-auto">{product.stockStatus === "coming_soon" ? "Coming soon" : "Out of stock"}</span>
          )}
        </div>

        <h3 className="font-semibold text-[#111111] text-[13px] sm:text-sm leading-snug line-clamp-2 mb-1 sm:mb-2">
          <Link href={`/shop/${product.id}`} className="block py-3.5 -my-2.5 hover:underline">
            {product.name}
          </Link>
        </h3>

        <ul className="mb-3 space-y-0.5 min-h-[36px]">
          {product.specs.slice(0, 3).map((s, i) => (
            <li key={s} className={`text-[11px] sm:text-xs text-[#666666] truncate ${i === 2 ? "hidden sm:block" : ""}`}>
              • {s}
            </li>
          ))}
        </ul>

        <p className="text-[11px] sm:text-xs text-[#666666] mb-2 sm:mb-3 flex items-start gap-1">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden />
          {warrantyLabel({ warrantyMonths: product.warrantyMonths ?? STORE_TERMS.warrantyMonths, serviceMonths: product.serviceMonths ?? STORE_TERMS.serviceMonths })}
        </p>
        {product.condition !== "new" && (
          <p className="text-[11px] sm:text-xs text-[#666666] mb-2 sm:mb-3 flex items-center gap-1 -mt-1 sm:-mt-2">
            <BadgeCheck className="w-3.5 h-3.5 shrink-0" aria-hidden />
            Quality Checked
          </p>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-[#E5E5E5]">
          <div>
            <p className="font-semibold text-[#111111] text-sm sm:text-base">{formatPrice(product.price)}</p>
            {savings !== null && product.originalPrice !== undefined && (
              <>
                <p className="text-xs text-[#999999] line-through">
                  {formatPrice(product.originalPrice)}
                </p>
                <p className="text-xs font-medium text-[#111111]">
                  You save {formatPrice(product.originalPrice - product.price)}
                </p>
              </>
            )}
          </div>
          <button
            id={`add-to-cart-${product.id}`}
            disabled={!product.inStock}
            onClick={() => addItem(product)}
            className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 min-h-11 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-[#111111]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {product.inStock ? "Add to cart" : product.stockStatus === "coming_soon" ? "Coming soon" : "Sold out"}
          </button>
        </div>
      </div>
    </TiltCard>
  );
}
