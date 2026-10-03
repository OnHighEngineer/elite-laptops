import { describe, expect, it } from "vitest";
import { CATEGORIES, parseProductForm, slugify } from "@/lib/admin-product";

const base: Record<string, string> = {
  name: "HP Pavilion 15",
  brand: "HP",
  category: "Student",
  condition: "refurbished",
  price: "38999",
  originalPrice: "45000",
  stock: "3",
  stockStatus: "in_stock",
  description: "Nice laptop",
  warrantyMonths: "3",
  serviceMonths: "12",
  warrantyNote: "Covers hardware faults. Excludes physical damage.",
  spec_processor: "Intel Core i5-12th Gen",
  spec_ram: "8GB DDR4",
  spec_storage: "512GB SSD",
  spec_graphics: "Intel Iris Xe",
  spec_screen: '15.6" FHD',
  spec_os: "Windows 11",
  spec_battery: "",
  specsExtra: "Backlit keyboard\n\nFingerprint reader",
  images: "https://res.cloudinary.com/demo/image/upload/a.jpg\nhttps://res.cloudinary.com/demo/image/upload/b.jpg",
  featured: "on",
};

describe("slugify", () => {
  it("makes a url-safe id", () => {
    expect(slugify("HP EliteBook 840 G8!")).toBe("hp-elitebook-840-g8");
    expect(slugify("  --Dell  XPS--  ")).toBe("dell-xps");
  });
});

describe("parseProductForm", () => {
  it("accepts a good form and normalises it", () => {
    expect(parseProductForm(base)).toEqual({
      ok: true,
      value: {
        id: "hp-pavilion-15",
        name: "HP Pavilion 15",
        brand: "HP",
        category: "Student",
        condition: "refurbished",
        price: 38999,
        originalPrice: 45000,
        stock: 3,
        stockStatus: "in_stock",
        description: "Nice laptop",
        warrantyMonths: 3,
        serviceMonths: 12,
        warrantyNote: "Covers hardware faults. Excludes physical damage.",
        specDetails: {
          processor: "Intel Core i5-12th Gen",
          ram: "8GB DDR4",
          storage: "512GB SSD",
          graphics: "Intel Iris Xe",
          screen: '15.6" FHD',
          os: "Windows 11",
          battery: "",
        },
        extraSpecs: ["Backlit keyboard", "Fingerprint reader"],
        image: "https://res.cloudinary.com/demo/image/upload/a.jpg",
        images: [
          "https://res.cloudinary.com/demo/image/upload/a.jpg",
          "https://res.cloudinary.com/demo/image/upload/b.jpg",
        ],
        featured: true,
      },
    });
  });
  it("offers a sensible category list", () => {
    expect(CATEGORIES).toContain("Business");
    expect(CATEGORIES).toContain("Gaming");
  });
  it("keeps the existing id when editing", () => {
    const r = parseProductForm({ ...base, name: "Renamed" }, "hp-pavilion-15");
    expect(r.ok && r.value.id).toBe("hp-pavilion-15");
  });
  it("treats a blank original price as none", () => {
    const r = parseProductForm({ ...base, originalPrice: "" });
    expect(r.ok && r.value.originalPrice).toBeNull();
  });
  it("allows blank optional specs, a blank warranty note and not featured", () => {
    const r = parseProductForm({ ...base, spec_graphics: "", spec_os: "", warrantyNote: "", specsExtra: "", featured: undefined } as never);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.featured).toBe(false);
      expect(r.value.extraSpecs).toEqual([]);
    }
  });
  it("drops blank lines and duplicate images", () => {
    const a = "https://res.cloudinary.com/demo/a.jpg";
    const r = parseProductForm({ ...base, images: `${a}\n\n${a}\nhttps://res.cloudinary.com/demo/b.jpg` });
    expect(r.ok && r.value.images).toEqual([a, "https://res.cloudinary.com/demo/b.jpg"]);
  });
  it("allows zero warranty", () => {
    const r = parseProductForm({ ...base, warrantyMonths: "0", serviceMonths: "0" });
    expect(r.ok).toBe(true);
  });

  const bad: [string, Record<string, string>, string][] = [
    ["empty name", { name: " " }, "name"],
    ["long name", { name: "x".repeat(121) }, "name"],
    ["unslugable name", { name: "!!" }, "name"],
    ["empty brand", { brand: "" }, "brand"],
    ["unknown category", { category: "Toys" }, "category"],
    ["bad condition", { condition: "used" }, "condition"],
    ["bad stock status", { stockStatus: "maybe" }, "stockStatus"],
    ["zero price", { price: "0" }, "price"],
    ["negative price", { price: "-5" }, "price"],
    ["decimal price", { price: "10.5" }, "price"],
    ["text price", { price: "abc" }, "price"],
    ["original not higher", { originalPrice: "38999" }, "originalPrice"],
    ["no images", { images: "" }, "images"],
    ["http image", { images: "http://res.cloudinary.com/a.jpg" }, "images"],
    ["foreign image host", { images: "https://evil.com/a.jpg" }, "images"],
    ["js image", { images: "javascript:alert(1)" }, "images"],
    ["one bad image among good ones", { images: "https://res.cloudinary.com/a.jpg\nhttps://evil.com/b.jpg" }, "images"],
    ["more than 6 images", { images: Array.from({ length: 7 }, (_, i) => `https://res.cloudinary.com/i${i}.jpg`).join("\n") }, "images"],
    ["negative stock", { stock: "-1" }, "stock"],
    ["huge stock", { stock: "1000" }, "stock"],
    ["text stock", { stock: "abc" }, "stock"],
    ["missing processor", { spec_processor: " " }, "spec_processor"],
    ["missing ram", { spec_ram: "" }, "spec_ram"],
    ["missing storage", { spec_storage: "" }, "spec_storage"],
    ["missing screen", { spec_screen: "" }, "spec_screen"],
    ["too long a spec", { spec_graphics: "x".repeat(81) }, "spec_graphics"],
    ["too many extra specs", { specsExtra: Array.from({ length: 9 }, (_, i) => `f${i}`).join("\n") }, "specsExtra"],
    ["warranty over 36 months", { warrantyMonths: "37" }, "warrantyMonths"],
    ["blank warranty months", { warrantyMonths: "" }, "warrantyMonths"],
    ["service over 60 months", { serviceMonths: "61" }, "serviceMonths"],
    ["long warranty note", { warrantyNote: "x".repeat(501) }, "warrantyNote"],
    ["long description", { description: "x".repeat(1001) }, "description"],
  ];
  for (const [label, patch, field] of bad) {
    it(`rejects ${label}`, () => {
      const r = parseProductForm({ ...base, ...patch });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors[field]).toBeDefined();
    });
  }
});
