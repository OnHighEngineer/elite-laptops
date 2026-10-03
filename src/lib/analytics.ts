export interface OrderRow {
  amount_inr: number;
  paid_at: string | null;
  lines: { id: string; name: string; qty: number; unitPrice: number }[];
}
export interface EventRow {
  product_id: string;
  type: string;
  n: number;
}

export interface Summary {
  revenue: number;
  orderCount: number;
  avgOrder: number;
  units: number;
  top: { id: string; name: string; units: number; revenue: number }[];
  perProduct: { id: string; name: string; views: number; adds: number; shares: number; units: number }[];
  daily: { date: string; revenue: number }[];
}

export function summarize(input: {
  orders: OrderRow[];
  events: EventRow[];
  catalog: { id: string; name: string }[];
  now: Date;
  days: number;
}): Summary {
  const { orders, events, catalog, now, days } = input;
  const sold = new Map<string, { units: number; revenue: number }>();
  let revenue = 0;
  let units = 0;
  const byDay = new Map<string, number>();

  for (const o of orders) {
    revenue += o.amount_inr;
    if (o.paid_at) {
      const d = o.paid_at.slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + o.amount_inr);
    }
    for (const l of o.lines) {
      const cur = sold.get(l.id) ?? { units: 0, revenue: 0 };
      cur.units += l.qty;
      cur.revenue += l.qty * l.unitPrice;
      sold.set(l.id, cur);
      units += l.qty;
    }
  }

  const names = new Map(catalog.map((c) => [c.id, c.name]));
  const top = [...sold.entries()]
    .filter(([id]) => names.has(id))
    .map(([id, v]) => ({ id, name: names.get(id)!, ...v }))
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue);

  const count = (id: string, type: string) =>
    events.filter((e) => e.product_id === id && e.type === type).reduce((s, e) => s + e.n, 0);
  const perProduct = catalog.map((c) => ({
    id: c.id,
    name: c.name,
    views: count(c.id, "view"),
    adds: count(c.id, "add_to_cart"),
    shares: count(c.id, "share"),
    units: sold.get(c.id)?.units ?? 0,
  }));

  const daily: { date: string; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    daily.push({ date: key, revenue: byDay.get(key) ?? 0 });
  }

  return {
    revenue,
    orderCount: orders.length,
    avgOrder: orders.length ? Math.round(revenue / orders.length) : 0,
    units,
    top,
    perProduct,
    daily,
  };
}
