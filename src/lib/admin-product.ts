import type { Condition, SpecDetails, StockStatus } from "@/data/products";

export const CATEGORIES = ["Student", "Business", "Gaming", "Everyday", "Creator", "Ultrabook"] as const;
export const STOCK_STATUSES: StockStatus[] = ["in_stock", "out_of_stock", "coming_soon"];

export interface ProductInput {
  id: string;
  name: string;
  brand: string;
  category: string;
  condition: Condition;
  price: number;
  originalPrice: number | null;
  stock: number;
  stockStatus: StockStatus;
  description: string;
  warrantyMonths: number;
  serviceMonths: number;
  warrantyNote: string;
  specDetails: SpecDetails;
  extraSpecs: string[];
  /** Cover image (first of `images`). */
  image: string;
  images: string[];
  featured: boolean;
}

export type ParseResult =
  | { ok: true; value: ProductInput }
  | { ok: false; errors: Record<string, string> };

const CONDITIONS: Condition[] = ["new", "refurbished", "open-box"];
const IMAGE_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];
export const MAX_IMAGES = 6;
const REQUIRED_SPECS = ["processor", "ram", "storage", "screen"] as const;
const OPTIONAL_SPECS = ["graphics", "os", "battery"] as const;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function wholeNumber(raw: string | undefined): number | null {
  const t = (raw ?? "").trim();
  return /^\d{1,9}$/.test(t) ? Number(t) : null;
}

/** Validates untrusted admin form input. Pass existingId when editing so the id never changes. */
export function parseProductForm(f: Record<string, string | undefined>, existingId?: string): ParseResult {
  const errors: Record<string, string> = {};
  const name = (f.name ?? "").trim();
  const brand = (f.brand ?? "").trim();
  const description = (f.description ?? "").trim();
  const warrantyNote = (f.warrantyNote ?? "").trim();
  const id = existingId ?? slugify(name);

  if (!name || name.length > 120 || !id) errors.name = "Enter a name (up to 120 characters).";
  if (!brand || brand.length > 40) errors.brand = "Enter a brand.";
  if (!(CATEGORIES as readonly string[]).includes(f.category ?? "")) errors.category = "Choose a category.";
  if (!CONDITIONS.includes(f.condition as Condition)) errors.condition = "Choose a condition.";
  if (!STOCK_STATUSES.includes(f.stockStatus as StockStatus)) errors.stockStatus = "Choose a stock status.";

  const price = wholeNumber(f.price);
  if (price === null || price < 1) errors.price = "Enter the price in whole rupees.";

  let originalPrice: number | null = null;
  if ((f.originalPrice ?? "").trim() !== "") {
    originalPrice = wholeNumber(f.originalPrice);
    if (originalPrice === null || (price !== null && originalPrice <= price)) {
      errors.originalPrice = "Original price must be higher than the price, or left blank.";
    }
  }

  const stock = wholeNumber(f.stock);
  if (stock === null || stock > 999) errors.stock = "Quantity must be a whole number from 0 to 999.";

  const warrantyMonths = wholeNumber(f.warrantyMonths);
  if (warrantyMonths === null || warrantyMonths > 36) errors.warrantyMonths = "Warranty: 0 to 36 months.";
  const serviceMonths = wholeNumber(f.serviceMonths);
  if (serviceMonths === null || serviceMonths > 60) errors.serviceMonths = "Service warranty: 0 to 60 months.";
  if (warrantyNote.length > 500) errors.warrantyNote = "Warranty policy is too long (max 500 characters).";
  if (description.length > 1000) errors.description = "Description is too long (max 1000 characters).";

  const specDetails: SpecDetails = { processor: "", ram: "", storage: "", graphics: "", screen: "", os: "", battery: "" };
  for (const key of REQUIRED_SPECS) {
    const v = (f[`spec_${key}`] ?? "").trim();
    if (!v || v.length > 80) errors[`spec_${key}`] = "Required (up to 80 characters).";
    specDetails[key] = v;
  }
  for (const key of OPTIONAL_SPECS) {
    const v = (f[`spec_${key}`] ?? "").trim();
    if (v.length > 80) errors[`spec_${key}`] = "Up to 80 characters.";
    specDetails[key] = v;
  }

  const extraSpecs = (f.specsExtra ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  if (extraSpecs.length > 8 || extraSpecs.some((s) => s.length > 80)) {
    errors.specsExtra = "Up to 8 extra features, one per line (80 characters each).";
  }

  // One URL per line; the first is the cover. Duplicates and blank lines are dropped.
  const images: string[] = [];
  for (const line of (f.images ?? "").split("\n").map((l) => l.trim()).filter(Boolean)) {
    try {
      const u = new URL(line);
      if (u.protocol !== "https:" || !IMAGE_HOSTS.includes(u.hostname)) throw new Error();
      if (!images.includes(u.toString())) images.push(u.toString());
    } catch {
      errors.images = "Every photo must be uploaded here (or come from Cloudinary).";
      break;
    }
  }
  if (!errors.images && images.length === 0) errors.images = "Add at least one photo.";
  if (!errors.images && images.length > MAX_IMAGES) errors.images = `Use at most ${MAX_IMAGES} photos.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      id,
      name,
      brand,
      category: f.category as string,
      condition: f.condition as Condition,
      price: price!,
      originalPrice,
      stock: stock!,
      stockStatus: f.stockStatus as StockStatus,
      description,
      warrantyMonths: warrantyMonths!,
      serviceMonths: serviceMonths!,
      warrantyNote,
      specDetails,
      extraSpecs,
      image: images[0],
      images,
      featured: f.featured === "on",
    },
  };
}
