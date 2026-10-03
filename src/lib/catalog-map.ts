import type { Product, SpecDetails, StockStatus } from "@/data/products";
import { effectiveStatus, specList } from "@/lib/product";

export interface CatalogRow {
  id: string; name: string; brand: string; condition: Product["condition"]; price: number;
  original_price: number | null; specs: string[]; description: string; image: string; images: string[];
  featured: boolean; stock: number; category: string; spec_details: SpecDetails; extra_specs: string[];
  stock_status: StockStatus; warranty_months: number; service_months: number; warranty_note: string;
}

export function rowToProduct(r: CatalogRow): Product {
  const status = effectiveStatus(r.stock_status, r.stock);
  const hasDetails = !!r.spec_details && Object.keys(r.spec_details).length > 0;
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    category: r.category,
    image: r.image,
    images: r.images?.length ? r.images : [r.image],
    price: r.price,
    originalPrice: r.original_price ?? undefined,
    specs: hasDetails ? specList(r.spec_details, r.extra_specs ?? []) : r.specs,
    specDetails: hasDetails ? r.spec_details : undefined,
    extraSpecs: r.extra_specs ?? [],
    condition: r.condition,
    inStock: status === "in_stock",
    stockStatus: status,
    stock: r.stock,
    warrantyMonths: r.warranty_months,
    serviceMonths: r.service_months,
    warrantyNote: r.warranty_note,
    featured: r.featured,
    description: r.description,
  };
}
