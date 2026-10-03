import Link from "next/link";
import { importSamples, setActive, setStock } from "@/app/admin/actions";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!adminConfigured()) {
    return <p className="text-sm text-[#666666]">Database is not configured yet. See docs/SETUP.md.</p>;
  }
  const { data: products, error } = await createAdminClient()
    .from("products").select("id, name, brand, condition, price, stock, active").order("created_at", { ascending: false });
  if (error) return <p className="text-sm text-[#B00020]">Run supabase/schema.sql first, then reload.</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#111111]">Laptops</h1>
        <Link href="/admin/products/new" className="inline-flex items-center min-h-11 px-5 bg-[#111111] text-white text-sm font-semibold rounded-xl">
          Add laptop
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="border border-[#E5E5E5] rounded-xl p-6 space-y-3">
          <p className="text-sm text-[#666666]">No laptops yet. The shop is showing the 10 sample laptops from the code file.</p>
          <form action={importSamples}>
            <button className="min-h-11 px-5 border border-[#E5E5E5] rounded-xl text-sm font-medium hover:bg-[#F5F5F5]">
              Import the 10 samples so I can edit them
            </button>
          </form>
        </div>
      ) : (
        <ul className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-xl">
          {products.map((p) => (
            <li key={p.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <p className="font-medium text-[#111111] truncate">{p.name} {!p.active && <span className="text-xs text-[#999999]">(hidden)</span>}</p>
                <p className="text-xs text-[#666666]">{p.brand} · {p.condition} · {formatPrice(p.price)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={setStock.bind(null, p.id)} className="flex items-center gap-1">
                  <label htmlFor={`stock-${p.id}`} className="sr-only">Stock for {p.name}</label>
                  <input id={`stock-${p.id}`} name="stock" type="number" min={0} max={999} defaultValue={p.stock}
                    className="w-20 min-h-11 px-3 border border-[#E5E5E5] rounded-lg text-base" />
                  <button className="min-h-11 px-3 border border-[#E5E5E5] rounded-lg text-sm hover:bg-[#F5F5F5]">Set</button>
                </form>
                <Link href={`/admin/products/${p.id}`} className="inline-flex items-center min-h-11 px-3 border border-[#E5E5E5] rounded-lg text-sm hover:bg-[#F5F5F5]">Edit</Link>
                <form action={setActive.bind(null, p.id, !p.active)}>
                  <button className="min-h-11 px-3 border border-[#E5E5E5] rounded-lg text-sm hover:bg-[#F5F5F5]">{p.active ? "Hide" : "Show"}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
