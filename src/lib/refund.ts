export type RefundErrorKind = "already_refunded" | "manual" | "retry";

/** Decides what to do after Razorpay rejects or fails a refund request. */
export function classifyRefundError(err: unknown): RefundErrorKind {
  const e = err as { statusCode?: number; error?: { description?: string } } | null;
  const text = String(e?.error?.description ?? "").toLowerCase();
  if (text.includes("fully refunded already")) return "already_refunded";
  if (e?.statusCode === 400 && text) return "manual"; // wrong amount or payment state: a person must look
  return "retry";
}
