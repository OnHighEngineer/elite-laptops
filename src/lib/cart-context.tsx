"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/products";
import { CART_KEY, parseCart, serializeCart } from "@/lib/cart-storage";
import { track } from "@/lib/track";

const MAX_QTY = 5;

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Restore after hydration, re-checking every saved item against the live catalog.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = parseCart(localStorage.getItem(CART_KEY), () => true);
        if (saved.length) {
          const res = await fetch("/api/catalog");
          const catalog: Product[] = res.ok ? await res.json() : [];
          const known = new Map(catalog.map((p) => [p.id, p]));
          const restored = saved.flatMap((l) => {
            const product = known.get(l.id);
            return product && product.inStock ? [{ product, quantity: Math.min(l.qty, product.stock ?? l.qty) }] : [];
          });
          if (!cancelled && restored.length) setItems(restored);
        }
      } catch {
        // Storage or network unavailable: the cart just stays in memory.
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        CART_KEY,
        serializeCart(items.map((i) => ({ id: i.product.id, qty: i.quantity })))
      );
    } catch {
      // ignore
    }
  }, [items, loaded]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: Product) => {
    track(product.id, "add_to_cart");
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QTY) }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === id ? { ...i, quantity: Math.min(qty, MAX_QTY) } : i
      )
    );
  }, []);

  const total = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, isOpen, openCart, closeCart, addItem, removeItem, updateQty, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
