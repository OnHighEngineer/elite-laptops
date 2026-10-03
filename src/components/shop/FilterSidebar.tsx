"use client";

import { BRANDS, type Condition } from "@/data/products";
import { conditionLabel } from "@/lib/product";
import { formatPrice } from "@/lib/utils";

export interface Filters {
  brands: string[];
  maxPrice: number;
  condition: "all" | Condition;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const PRICE_MAX = 100000;

export function FilterSidebar({ filters, onChange }: Props) {
  const toggleBrand = (b: string) => {
    const next = filters.brands.includes(b)
      ? filters.brands.filter((x) => x !== b)
      : [...filters.brands, b];
    onChange({ ...filters, brands: next });
  };

  return (
    <aside className="w-full lg:w-56 shrink-0 space-y-7">
      {/* Brand */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-3">
          Brand
        </p>
        <ul className="space-y-2">
          {BRANDS.map((b) => (
            <li key={b}>
              <label className="flex items-center gap-2.5 cursor-pointer group min-h-11 lg:min-h-0">
                <input
                  id={`brand-${b}`}
                  type="checkbox"
                  checked={filters.brands.includes(b)}
                  onChange={() => toggleBrand(b)}
                  className="w-4 h-4 rounded border-[#E5E5E5] accent-[#111111]"
                />
                <span className="text-sm text-[#666666] group-hover:text-[#111111] transition-colors">
                  {b}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Condition */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-3">
          Condition
        </p>
        <ul className="space-y-2">
          {(["all", "new", "refurbished", "open-box"] as const).map((c) => (
            <li key={c}>
              <label className="flex items-center gap-2.5 cursor-pointer group min-h-11 lg:min-h-0">
                <input
                  id={`condition-${c}`}
                  type="radio"
                  name="condition"
                  checked={filters.condition === c}
                  onChange={() => onChange({ ...filters, condition: c })}
                  className="w-4 h-4 accent-[#111111]"
                />
                <span className="text-sm text-[#666666] group-hover:text-[#111111] transition-colors">
                  {c === "all" ? "All" : conditionLabel(c)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-3">
          Max Price
        </p>
        <input
          id="price-range"
          type="range"
          min={5000}
          max={PRICE_MAX}
          step={1000}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-[#111111]"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-[#999999]">{formatPrice(5000)}</span>
          <span className="text-xs font-medium text-[#111111]">
            {formatPrice(filters.maxPrice)}
          </span>
        </div>
      </div>

      {/* Reset */}
      <button
        id="filter-reset"
        onClick={() =>
          onChange({ brands: [], maxPrice: PRICE_MAX, condition: "all" })
        }
        className="text-xs text-[#666666] underline hover:text-[#111111] transition-colors min-h-11 lg:min-h-0"
      >
        Reset filters
      </button>
    </aside>
  );
}
