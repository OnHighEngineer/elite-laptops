"use client";

import { useEffect, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { EliteLogo } from "@/components/common/Logo";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop Laptops" },
  { href: "/contact", label: "Contact Us" },
];

function SearchForm({
  className,
  id,
  onSubmit,
}: {
  className?: string;
  id: string;
  onSubmit?: () => void;
}) {
  return (
    <Form action="/shop" role="search" onSubmit={onSubmit} className={cn("relative", className)}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]"
        aria-hidden
      />
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search laptops"
        aria-label="Search laptops"
        className="w-full min-h-11 pl-9 pr-3 border border-[#E5E5E5] rounded-full text-base md:text-sm text-[#111111] placeholder:text-[#999999] bg-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#111111] focus:bg-white"
      />
    </Form>
  );
}

export function Navbar({ accountSlot }: { accountSlot?: ReactNode }) {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Close the mobile menu after navigating.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E5E5E5]">
      <nav
        aria-label="Main"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4"
      >
        <Link href="/" className="flex items-center gap-2.5 shrink-0 min-h-11">
          <EliteLogo className="w-9 h-9 shrink-0" />
          <span className="font-bold text-[#111111] text-sm tracking-tight">Elite Laptops</span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "px-3.5 py-2 rounded-full text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-[#111111] bg-[#F5F5F5]"
                    : "text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5]"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <SearchForm id="nav-search" className="hidden md:block flex-1 max-w-xs" />

        <div className="flex items-center gap-1">
          {accountSlot}
          <button
            id="cart-button"
            onClick={openCart}
            className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-5 h-5 text-[#111111]" />
            {count > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#111111] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
          <button
            id="mobile-menu-button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-[#E5E5E5] bg-white px-4 py-4 space-y-3">
          <SearchForm id="mobile-search" onSubmit={() => setMenuOpen(false)} />
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center min-h-11 px-3 rounded-lg text-sm font-medium",
                    pathname === link.href ? "bg-[#F5F5F5] text-[#111111]" : "text-[#666666]"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
