"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { FilterSidebar, type Filters } from "./FilterSidebar";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/data/products";

interface Props {
  products: Product[];
  title?: string;
  initialQuery?: string;
}

const DEFAULT_FILTERS: Filters = {
  brands: [],
  maxPrice: 100000,
  condition: "all",
};

type SortKey = "default" | "price-asc" | "price-desc";

export function ProductGrid({ products, title, initialQuery = "" }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("default");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    const toggle = toggleRef.current;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFiltersOpen(false);
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        "button, input, select, a[href], [tabindex]:not([tabindex='-1'])"
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [filtersOpen]);

  const filtered = useMemo(() => {
    let list = [...products];
    const q = initialQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
    }

    if (filters.brands.length > 0) {
      list = list.filter((p) => filters.brands.includes(p.brand));
    }
    if (filters.condition !== "all") {
      list = list.filter((p) => p.condition === filters.condition);
    }
    list = list.filter((p) => p.price <= filters.maxPrice);

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);

    return list;
  }, [products, filters, sort, initialQuery]);

  return (
    <div>
      {title && (
        <h1 className="text-2xl font-semibold text-[#111111] mb-8">{title}</h1>
      )}

      {/* Mobile filter toggle + sort */}
      <div className="flex items-center justify-between gap-3 mb-6 lg:hidden">
        <button
          id="mobile-filters-toggle"
          ref={toggleRef}
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((v) => !v)}
          aria-haspopup="dialog"
          className="flex items-center gap-2 px-4 min-h-11 border border-[#E5E5E5] rounded-lg text-sm text-[#111111] hover:bg-[#F5F5F5] transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
        <SortSelect value={sort} onChange={setSort} />
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar: desktop only */}
        <div className="hidden lg:block">
          <FilterSidebar filters={filters} onChange={setFilters} />
        </div>

        {/* Mobile filter sheet */}
        {filtersOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setFiltersOpen(false)}
              aria-hidden
            />
            <div
              ref={sheetRef}
              className="absolute bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl p-5 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[#111111]">Filters</h2>
                <button
                  id="mobile-filters-close"
                  ref={closeRef}
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#F5F5F5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterSidebar filters={filters} onChange={setFilters} />
              <button
                id="mobile-filters-apply"
                onClick={() => setFiltersOpen(false)}
                className="w-full min-h-12 bg-[#111111] text-white text-sm font-semibold rounded-xl"
              >
                Show {filtered.length} {filtered.length === 1 ? "laptop" : "laptops"}
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {/* Sort - desktop */}
          <div className="hidden lg:flex justify-end mb-6">
            <SortSelect value={sort} onChange={setSort} />
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              {initialQuery.trim() ? (
                <>
                  <p className="text-[#666666] text-sm mb-4">
                    No results for &ldquo;{initialQuery.trim()}&rdquo;.
                  </p>
                  <Link
                    href="/shop"
                    className="inline-flex items-center min-h-11 px-5 border border-[#E5E5E5] rounded-lg text-sm font-medium text-[#111111] hover:bg-[#F5F5F5]"
                  >
                    View all laptops
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[#666666] text-sm mb-4">No products match your filters.</p>
                  <button
                    id="empty-clear-filters"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="min-h-11 px-5 border border-[#E5E5E5] rounded-lg text-sm font-medium text-[#111111] hover:bg-[#F5F5F5]"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-[#999999]">{filtered.length} {filtered.length === 1 ? "product" : "products"}</p>
        </div>
      </div>
    </div>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <select
      id="sort-select"
      value={value}
      onChange={(e) => onChange(e.target.value as SortKey)}
      className="text-base sm:text-sm min-h-11 border border-[#E5E5E5] rounded-lg px-3 text-[#111111] bg-white focus:outline-none focus:ring-1 focus:ring-[#111111]"
    >
      <option value="default">Sort: Default</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  );
}
