import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const metadata: Metadata = {
  title: "Shop Laptops — HP, Dell, Lenovo, Asus",
  description: "Browse certified refurbished laptops from top brands. Filter by brand, price, and condition.",
};

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function ShopPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] : q;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ProductGrid
        products={await getCatalog()}
        title={query ? `Results for "${query}"` : "All Laptops"}
        initialQuery={query}
      />
    </div>
  );
}
