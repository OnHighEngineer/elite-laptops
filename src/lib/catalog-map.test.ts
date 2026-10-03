import { describe, expect, it } from "vitest";
import { rowToProduct, type CatalogRow } from "@/lib/catalog-map";

const row: CatalogRow = {
  id: "a", name: "A", brand: "HP", condition: "refurbished", price: 100, original_price: 150,
  specs: ["legacy"], description: "d", image: "https://res.cloudinary.com/x/a.jpg",
  images: ["https://res.cloudinary.com/x/a.jpg", "https://res.cloudinary.com/x/b.jpg"],
  featured: true, stock: 3, category: "Business",
  spec_details: { processor: "i5", ram: "8GB", storage: "256GB", graphics: "", screen: '14"', os: "", battery: "" },
  extra_specs: ["Backlit"], stock_status: "in_stock", warranty_months: 6, service_months: 24, warranty_note: "n",
};

describe("rowToProduct", () => {
  it("maps columns and builds the spec list from structured details", () => {
    const p = rowToProduct(row);
    expect(p).toMatchObject({ id: "a", originalPrice: 150, category: "Business", warrantyMonths: 6, serviceMonths: 24, stock: 3 });
    expect(p.specs).toEqual(["i5", "8GB", "256GB", '14"', "Backlit"]);
    expect(p.images).toHaveLength(2);
  });
  it("is in stock only with quantity", () => {
    expect(rowToProduct(row).inStock).toBe(true);
    expect(rowToProduct({ ...row, stock: 0 }).inStock).toBe(false);
    expect(rowToProduct({ ...row, stock: 0 }).stockStatus).toBe("out_of_stock");
  });
  it("never sells a coming-soon or out-of-stock laptop even if quantity is set", () => {
    expect(rowToProduct({ ...row, stock_status: "coming_soon" }).inStock).toBe(false);
    expect(rowToProduct({ ...row, stock_status: "out_of_stock" }).inStock).toBe(false);
  });
  it("falls back to legacy specs and a single image for old rows", () => {
    const old = rowToProduct({ ...row, spec_details: {} as never, images: [] });
    expect(old.specs).toEqual(["legacy"]);
    expect(old.specDetails).toBeUndefined();
    expect(old.images).toEqual([row.image]);
  });
  it("leaves originalPrice undefined when null", () => {
    expect(rowToProduct({ ...row, original_price: null }).originalPrice).toBeUndefined();
  });
});
