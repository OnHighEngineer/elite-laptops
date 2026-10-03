import { unstable_cache } from "next/cache";
import { laptops, type Product } from "@/data/products";
import { rowToProduct, type CatalogRow } from "@/lib/catalog-map";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

export const CATALOG_TAG = "catalog";

async function loadCatalog(): Promise<Product[]> {
  if (!adminConfigured()) return laptops;
  try {
    const { data, error } = await createAdminClient()
      .from("products").select("*").eq("active", true).order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return laptops;
    return (data as CatalogRow[]).map(rowToProduct);
  } catch {
    return laptops;
  }
}

// One database read is shared by every visitor and cleared the moment the admin saves a change.
// The 5 minute expiry is only a safety net.
const cachedCatalog = unstable_cache(loadCatalog, ["catalog-v1"], { tags: [CATALOG_TAG], revalidate: 300 });

/** Server-only. Live products from Supabase; falls back to the bundled list until the table exists/has rows. */
export async function getCatalog(): Promise<Product[]> {
  return cachedCatalog();
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return (await getCatalog()).find((p) => p.id === id);
}
