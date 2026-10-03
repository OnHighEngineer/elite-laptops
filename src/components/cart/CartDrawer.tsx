"use client";

import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Drawer } from "@/components/motion/drawer";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total } = useCart();

  return (
    <Drawer open={isOpen} onOpenChange={closeCart} side="right" ariaLabel="Shopping cart">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]">
        <h2 className="font-semibold text-[#111111]">Cart</h2>
        <button
          id="cart-close"
          onClick={closeCart}
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] transition-colors"
          aria-label="Close cart"
        >
          <X className="w-4 h-4 text-[#666666]" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center px-8">
            <ShoppingBag className="w-10 h-10 text-[#E5E5E5]" />
            <p className="text-sm text-[#666666]">Your cart is empty.</p>
            <p className="text-xs text-[#999999]">Add a laptop to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E5E5E5]">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-3 px-5 py-4">
                {/* Image placeholder */}
                <div className="w-16 h-16 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5] shrink-0 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#CCCCCC]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111111] truncate">{product.name}</p>
                  <p className="text-xs text-[#666666] mt-0.5">{product.specs[0]}</p>
                  <p className="text-sm font-semibold text-[#111111] mt-1">
                    {formatPrice(product.price)}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      id={`qty-minus-${product.id}`}
                      onClick={() => updateQty(product.id, quantity - 1)}
                      className="w-11 h-11 sm:w-9 sm:h-9 rounded border border-[#E5E5E5] flex items-center justify-center hover:bg-[#F5F5F5] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3 text-[#666666]" />
                    </button>
                    <span className="text-sm font-medium text-[#111111] w-5 text-center">
                      {quantity}
                    </span>
                    <button
                      id={`qty-plus-${product.id}`}
                      onClick={() => updateQty(product.id, quantity + 1)}
                      className="w-11 h-11 sm:w-9 sm:h-9 rounded border border-[#E5E5E5] flex items-center justify-center hover:bg-[#F5F5F5] transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3 text-[#666666]" />
                    </button>

                    <button
                      id={`remove-${product.id}`}
                      onClick={() => removeItem(product.id)}
                      className="ml-auto w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded hover:bg-[#F5F5F5] transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#999999]" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="border-t border-[#E5E5E5] px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#666666]">Total</span>
            <span className="font-semibold text-[#111111] text-base">
              {formatPrice(total)}
            </span>
          </div>
          <p className="text-xs text-[#999999]">Free shipping across India.</p>
          <Link
            id="checkout-button"
            href="/checkout"
            onClick={closeCart}
            className="flex items-center justify-center w-full min-h-12 py-3 bg-[#111111] text-white text-sm font-medium rounded-lg hover:bg-[#111111]/85 transition-colors"
          >
            Checkout
          </Link>
        </div>
      )}
    </Drawer>
  );
}
