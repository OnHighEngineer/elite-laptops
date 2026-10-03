"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { parseProductForm } from "@/lib/admin-product";
import { specList } from "@/lib/product";
import { appendHistory, codDeliveryError, isStatus, validateUpdate, type FulfillmentStatus, type HistoryEntry } from "@/lib/fulfillment";
import { refundOrder } from "@/lib/refund-payment";
import { sendEmail } from "@/lib/email";
import { shippedEmailText } from "@/lib/orders";
import { CATALOG_TAG } from "@/lib/catalog";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

export type SaveState = { errors?: Record<string, string>; error?: string } | undefined;

async function requireAdmin() {
  if (!(await isAdmin()) || !adminConfigured()) throw new Error("Not found");
}

export async function saveProduct(existingId: string | null, _: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  const raw: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") raw[k] = v;

  const parsed = parseProductForm(raw, existingId ?? undefined);
  if (!parsed.ok) return { errors: parsed.errors };
  const v = parsed.value;

  const row = {
    id: v.id, name: v.name, brand: v.brand, category: v.category, condition: v.condition, price: v.price,
    original_price: v.originalPrice, description: v.description, image: v.image, images: v.images, featured: v.featured,
    stock: v.stock, stock_status: v.stockStatus, warranty_months: v.warrantyMonths,
    service_months: v.serviceMonths, warranty_note: v.warrantyNote, spec_details: v.specDetails,
    extra_specs: v.extraSpecs, specs: specList(v.specDetails, v.extraSpecs),
    updated_at: new Date().toISOString(),
  };
  const admin = createAdminClient();
  const { error } = existingId
    ? await admin.from("products").update(row).eq("id", existingId)
    : await admin.from("products").insert(row);
  if (error) {
    return { error: error.code === "23505" ? "A laptop with this name already exists." : "Could not save. Please try again." };
  }
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function setActive(id: string, active: boolean) {
  await requireAdmin();
  await createAdminClient().from("products").update({ active, updated_at: new Date().toISOString() }).eq("id", id);
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}

export async function setStock(id: string, form: FormData) {
  await requireAdmin();
  const n = Number(form.get("stock"));
  if (!Number.isInteger(n) || n < 0 || n > 999) return;
  await createAdminClient().from("products").update({ stock: n, updated_at: new Date().toISOString() }).eq("id", id);
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}

export async function importSamples() {
  await requireAdmin();
  const { laptops } = await import("@/data/products");
  const rows = laptops.map((p) => {
    const [processor = "", ram = "", storage = "", screen = ""] = p.specs;
    return {
      id: p.id, name: p.name, brand: p.brand, category: "Everyday", condition: p.condition, price: p.price,
      original_price: p.originalPrice ?? null, description: p.description, image: p.image, images: [p.image],
      featured: Boolean(p.featured), stock: p.inStock ? 3 : 0,
      stock_status: p.inStock ? "in_stock" : "out_of_stock",
      warranty_months: 3, service_months: 12, warranty_note: "",
      spec_details: { processor, ram, storage, graphics: "", screen, os: "", battery: "" },
      extra_specs: [], specs: p.specs,
    };
  });
  await createAdminClient().from("products").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
  redirect("/admin/products");
}


export type OrderUpdateState = { errors?: Record<string, string>; error?: string; ok?: boolean } | undefined;

export async function updateOrderStatus(orderId: string, _: OrderUpdateState, form: FormData): Promise<OrderUpdateState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders").select("id, status, fulfillment_status, status_history, razorpay_order_id, shipping, payment_method, amount_inr, advance_inr, balance_received_at")
    .eq("id", orderId).maybeSingle();
  // Only fully paid orders can be fulfilled. Orders flagged for review are handled by refunding or restocking first.
  if (!order || order.status !== "paid") return { error: "This order cannot be updated." };

  const current = (isStatus(order.fulfillment_status) ? order.fulfillment_status : "confirmed") as FulfillmentStatus;
  const result = validateUpdate(
    {
      status: String(form.get("status") ?? ""),
      courier: String(form.get("courier") ?? ""),
      trackingNumber: String(form.get("trackingNumber") ?? ""),
      trackingUrl: String(form.get("trackingUrl") ?? ""),
    },
    current
  );
  if (!result.ok) return { errors: result.errors };
  const v = result.value;

  // Cash on delivery: the courier must have handed over the balance before the order can be completed.
  const received = form.get("balanceReceived") === "on" || Boolean(order.balance_received_at);
  if (v.status === "delivered") {
    const blocked = codDeliveryError(order.payment_method, received);
    if (blocked) return { errors: { balanceReceived: blocked } };
  }

  const history = appendHistory((order.status_history as HistoryEntry[]) ?? [], v.status);
  const { error } = await admin.from("orders").update({
    fulfillment_status: v.status, courier: v.courier, tracking_number: v.trackingNumber,
    tracking_url: v.trackingUrl, status_history: history,
    ...(order.payment_method === "cod" && received && !order.balance_received_at ? { balance_received_at: new Date().toISOString() } : {}),
  }).eq("id", orderId).eq("fulfillment_status", current); // only if nobody changed it meanwhile
  if (error) return { error: "Could not save. Please try again." };

  // Email the customer once, the first time it is marked shipped.
  if (v.status === "shipped" && current !== "shipped" && v.courier && v.trackingNumber) {
    const sh = order.shipping as { email: string; address: string; city: string; state: string; pincode: string };
    await sendEmail(
      sh.email,
      "Your Elite Laptops order has shipped",
      shippedEmailText({
        orderId: order.razorpay_order_id, courier: v.courier, trackingNumber: v.trackingNumber,
        trackingUrl: v.trackingUrl, shipping: `${sh.address}, ${sh.city}, ${sh.state} ${sh.pincode}`,
        balanceDue: order.payment_method === "cod" ? order.amount_inr - (order.advance_inr ?? 0) : 0,
      })
    );
  }
  revalidatePath("/admin/orders");
  revalidatePath("/orders", "layout");
  return { ok: true };
}


export async function retryRefund(orderId: string): Promise<void> {
  await requireAdmin();
  await refundOrder(orderId, "Refund retried by admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function cancelCodOrder(orderId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: o } = await admin.from("orders").select("id, status, payment_method, fulfillment_status, lines").eq("id", orderId).maybeSingle();
  // Only an undelivered COD order can be cancelled this way. The advance is refunded, and the laptop goes back on sale.
  if (!o || o.status !== "paid" || o.payment_method !== "cod" || o.fulfillment_status === "delivered") return;
  const outcome = await refundOrder(orderId, "COD order cancelled by store");
  if (outcome === "manual") return;
  for (const l of (o.lines as { id: string; qty: number }[])) {
    const { data: p } = await admin.from("products").select("stock").eq("id", l.id).maybeSingle();
    if (p) await admin.from("products").update({ stock: p.stock + l.qty, updated_at: new Date().toISOString() }).eq("id", l.id);
  }
  await admin.from("orders").update({ status: "failed", refund_note: "Cancelled by store; advance refunded; stock restored" }).eq("id", orderId);
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
