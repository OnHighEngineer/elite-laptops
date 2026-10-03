import { describe, expect, it } from "vitest";
import { INDIAN_STATES, isIndianState } from "@/data/indian-states";

describe("INDIAN_STATES", () => {
  it("lists 28 states and 8 union territories, all unique", () => {
    expect(INDIAN_STATES).toHaveLength(36);
    expect(new Set(INDIAN_STATES).size).toBe(36);
  });
  it("includes the seller's state", () => {
    expect(INDIAN_STATES).toContain("Karnataka");
  });
});

describe("isIndianState", () => {
  it("accepts exact names, ignoring case and spacing", () => {
    expect(isIndianState("Karnataka")).toBe(true);
    expect(isIndianState("  karnataka ")).toBe(true);
  });
  it("rejects misspellings and non-states", () => {
    for (const bad of ["Karnatka", "Bangalore", "", "India", "Karnataka!"]) expect(isIndianState(bad)).toBe(false);
  });
});
