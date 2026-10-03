import Link from "next/link";
import { summarize } from "@/lib/analytics";
import { getCatalog } from "@/lib/catalog";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAYS = 30;

function windowStart(days: number): Date {
  return new Date(Date.now() - days * 24 * 3600 * 1000);
}

export default async function AdminDashboard() {
  if (!adminConfigured()) {
    return <p className="text-sm text-[#666666]">Database is not configured yet. See docs/SETUP.md.</p>;
  }
  const admin = createAdminClient();
  const since = windowStart(DAYS);

  const [{ data: orders, error }, { data: events }, { data: review }, catalog] = await Promise.all([
    admin.from("orders").select("amount_inr, paid_at, lines").eq("status", "paid").gte("paid_at", since.toISOString()),
    admin.from("product_events").select("product_id, type, n").gte("day", since.toISOString().slice(0, 10)),
    admin.from("orders").select("razorpay_order_id, amount_inr").eq("status", "paid_needs_review"),
    getCatalog(),
  ]);
  if (error) return <p className="text-sm text-[#B00020]">Run supabase/schema.sql first, then reload.</p>;

  const s = summarize({
    orders: orders ?? [],
    events: events ?? [],
    catalog: catalog.map((p) => ({ id: p.id, name: p.name })),
    now: new Date(),
    days: DAYS,
  });
  const max = Math.max(1, ...s.daily.map((d) => d.revenue));
  const lowStock = catalog.filter((p) => p.stock !== undefined && p.stock <= 2);

  const stat = (label: string, value: string) => (
    <div className="border border-[#E5E5E5] rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-[#666666]">{label}</p>
      <p className="text-2xl font-bold text-[#111111] mt-1">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#111111]">Dashboard <span className="text-sm font-normal text-[#666666]">last {DAYS} days</span></h1>

      {review && review.length > 0 && (
        <div role="alert" className="border border-[#B00020] rounded-xl p-4 text-sm text-[#B00020]">
          {review.length} paid order(s) exceeded stock and need a refund or restock:{" "}
          {review.map((r) => r.razorpay_order_id).join(", ")}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stat("Revenue", formatPrice(s.revenue))}
        {stat("Orders", String(s.orderCount))}
        {stat("Average order", formatPrice(s.avgOrder))}
        {stat("Laptops sold", String(s.units))}
      </div>

      <section aria-labelledby="rev-h">
        <h2 id="rev-h" className="text-sm font-semibold text-[#111111] mb-3">Revenue per day</h2>
        <div className="flex items-end gap-1 h-32 border-b border-[#E5E5E5]" role="img" aria-label={`Revenue per day over the last ${DAYS} days`}>
          {s.daily.map((d) => (
            <div key={d.date} title={`${d.date}: ${formatPrice(d.revenue)}`} className="flex-1 bg-[#111111] rounded-t min-h-px"
              style={{ height: `${Math.max(1, (d.revenue / max) * 100)}%`, opacity: d.revenue ? 1 : 0.15 }} />
          ))}
        </div>
      </section>

      <section aria-labelledby="eng-h" className="space-y-3">
        <h2 id="eng-h" className="text-sm font-semibold text-[#111111]">Engagement per laptop</h2>
        <div className="overflow-x-auto border border-[#E5E5E5] rounded-xl">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-[#666666] border-b border-[#E5E5E5]">
                <th className="p-3 font-medium">Laptop</th><th className="p-3 font-medium">Views</th>
                <th className="p-3 font-medium">Added to cart</th><th className="p-3 font-medium">Shared</th>
                <th className="p-3 font-medium">Sold</th>
              </tr>
            </thead>
            <tbody>
              {[...s.perProduct].sort((a, b) => b.views - a.views).map((p) => (
                <tr key={p.id} className="border-b border-[#E5E5E5] last:border-0">
                  <td className="p-3 text-[#111111]">{p.name}</td><td className="p-3">{p.views}</td>
                  <td className="p-3">{p.adds}</td><td className="p-3">{p.shares}</td><td className="p-3">{p.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="low-h" className="space-y-2">
        <h2 id="low-h" className="text-sm font-semibold text-[#111111]">Low or no stock</h2>
        {lowStock.length === 0 ? (
          <p className="text-sm text-[#666666]">Everything is well stocked.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {lowStock.map((p) => (
              <li key={p.id}><Link href={`/admin/products/${p.id}`} className="underline text-[#111111]">{p.name}</Link>{" "}
                <span className="text-[#666666]">{p.stock} left</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
