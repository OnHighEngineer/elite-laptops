import { describe, expect, it } from "vitest";
import { laptops } from "@/data/products";
import { conditionLabel, discountPercent, effectiveStatus, findProduct, specList } from "@/lib/product";
import { STORE_GSTIN, STORE_TERMS, warrantyLabel } from "@/lib/store-terms";

describe("discountPercent", () => {
  it("always returns null since discount percentage badges are removed", () => {
    expect(discountPercent({ price: 38999, originalPrice: 45000 })).toBeNull();
    expect(discountPercent({ price: 100 })).toBeNull();
  });
});

describe("conditionLabel", () => {
  it("maps every grade to Refurbished", () => {
    expect(conditionLabel("new")).toBe("Refurbished");
    expect(conditionLabel("refurbished")).toBe("Refurbished");
    expect(conditionLabel("open-box")).toBe("Refurbished");
  });
});

describe("findProduct", () => {
  it("finds a product", () => {
    expect(findProduct(laptops, "hp-pavilion-15")?.name).toBe("HP Pavilion 15");
  });
  it("returns undefined for an unknown id", () => {
    expect(findProduct(laptops, "nope")).toBeUndefined();
  });
});

describe("store terms", () => {
  it("states the confirmed terms", () => {
    expect(STORE_TERMS).toEqual({ warrantyMonths: 3, serviceMonths: 12, exchangeDays: 7 });
    expect(warrantyLabel()).toBe("3 months warranty + 1 year service");
  });
});

describe("effectiveStatus", () => {
  it("in stock needs quantity", () => {
    expect(effectiveStatus("in_stock", 3)).toBe("in_stock");
    expect(effectiveStatus("in_stock", 0)).toBe("out_of_stock");
  });
  it("keeps the other statuses as set", () => {
    expect(effectiveStatus("out_of_stock", 5)).toBe("out_of_stock");
    expect(effectiveStatus("coming_soon", 5)).toBe("coming_soon");
  });
});

describe("specList", () => {
  const d = { processor: "i5", ram: "8GB", storage: "512GB SSD", graphics: "", screen: '15.6"', os: "Windows 11", battery: "" };
  it("orders main specs first, skips blanks, appends extras", () => {
    expect(specList(d, ["Backlit keyboard"])).toEqual(["i5", "8GB", "512GB SSD", '15.6"', "Windows 11", "Backlit keyboard"]);
  });
});

describe("warrantyLabel per product", () => {
  it("formats months and years", () => {
    expect(warrantyLabel({ warrantyMonths: 6, serviceMonths: 24 })).toBe("6 months warranty + 2 years service");
    expect(warrantyLabel({ warrantyMonths: 1, serviceMonths: 12 })).toBe("1 month warranty + 1 year service");
    expect(warrantyLabel({ warrantyMonths: 12, serviceMonths: 0 })).toBe("1 year warranty");
    expect(warrantyLabel({ warrantyMonths: 0, serviceMonths: 6 })).toBe("6 months service");
    expect(warrantyLabel({ warrantyMonths: 0, serviceMonths: 0 })).toBe("No warranty");
  });
});

describe("STORE_GSTIN", () => {
  it("is a well-formed 15-character Indian GSTIN for Karnataka (state code 29)", () => {
    expect(STORE_GSTIN).toMatch(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/);
    expect(STORE_GSTIN.startsWith("29")).toBe(true);
  });
});
