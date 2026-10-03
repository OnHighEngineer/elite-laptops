import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/ProductCard";

export async function FeaturedProducts() {
  const featured = (await getCatalog()).filter((p) => p.featured).slice(0, 6);

  return (
    <section className="bg-white border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#111111]">Featured Laptops</h2>
            <p className="text-sm text-[#666666] mt-1">
              Hand-picked certified refurbished picks
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-[#111111] hover:text-[#666666] transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <Link
          href="/shop"
          className="sm:hidden flex items-center gap-1 mt-5 min-h-11 text-sm font-medium text-[#111111]"
        >
          View all laptops <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
