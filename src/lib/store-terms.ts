export const STORE_TERMS = {
  warrantyMonths: 3,
  serviceMonths: 12,
  exchangeDays: 7,
} as const;

export const STORE_NAME = "Elite Laptops & Solutions";
export const STORE_GSTIN = "29NHTPS4793B1Z9";
export const STORE_ADDRESS = "#224, Near Standard School, Kannada Kasturi Road, T. Dasarahalli, Bangalore - 560057";

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

function span(months: number): string {
  return months >= 12 && months % 12 === 0 ? plural(months / 12, "year") : plural(months, "month");
}

/** Defaults to the store-wide terms; pass a product's own values to override. */
export function warrantyLabel(
  t: { warrantyMonths: number; serviceMonths: number } = STORE_TERMS
): string {
  const w = t.warrantyMonths;
  const sv = t.serviceMonths;
  if (w > 0 && sv > 0) return `${span(w)} warranty + ${span(sv)} service`;
  if (w > 0) return `${span(w)} warranty`;
  if (sv > 0) return `${span(sv)} service`;
  return "No warranty";
}
