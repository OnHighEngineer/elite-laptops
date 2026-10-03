import { describe, expect, it } from "vitest";
import { validateContact } from "@/lib/contact";

const ok = { name: "Asha", email: "asha@example.com", topic: "Order", message: "Hello there" };

describe("validateContact", () => {
  it("accepts a valid message", () => {
    expect(validateContact(ok)).toEqual({});
  });
  it("rejects empty name, bad email and empty message", () => {
    const e = validateContact({ ...ok, name: " ", email: "nope", message: "" });
    expect(Object.keys(e).sort()).toEqual(["email", "message", "name"]);
  });
  it("rejects an email without a domain dot", () => {
    expect(validateContact({ ...ok, email: "a@b" }).email).toBeDefined();
  });
});
