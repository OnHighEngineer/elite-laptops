import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  if (!adminConfigured()) notFound();
  const { data: p } = await createAdminClient().from("products").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const d = (p.spec_details ?? {}) as Record<string, string>;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-[#111111]">Edit laptop</h1>
      <ProductForm
        existingId={p.id}
        defaults={{
          name: p.name, brand: p.brand, category: p.category ?? "Everyday", condition: p.condition,
          price: String(p.price), originalPrice: p.original_price ? String(p.original_price) : "",
          stock: String(p.stock), stockStatus: p.stock_status ?? "in_stock", description: p.description,
          warrantyMonths: String(p.warranty_months ?? 3), serviceMonths: String(p.service_months ?? 12),
          warrantyNote: p.warranty_note ?? "",
          spec_processor: d.processor ?? "", spec_ram: d.ram ?? "", spec_storage: d.storage ?? "",
          spec_graphics: d.graphics ?? "", spec_screen: d.screen ?? "", spec_os: d.os ?? "", spec_battery: d.battery ?? "",
          specsExtra: ((p.extra_specs as string[]) ?? []).join("\n"), images: ((p.images as string[])?.length ? (p.images as string[]) : [p.image]).join("\n"), featured: p.featured,
        }}
      />
    </div>
  );
}
