import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";

export const metadata: Metadata = {
  title: "About Us",
  description: "Elite Laptops & Solutions sells certified refurbished laptops from Bangalore, Karnataka.",
};

export default function AboutPage() {
  return (
    <PolicyPage title="About Us">
      <p>
        Elite Laptops &amp; Solutions is based in Bangalore, Karnataka. We sell certified
        refurbished laptops from brands such as HP, Dell, Lenovo and Asus.
      </p>
      <p>
        Every laptop is quality inspected and comes with a 3-month full warranty and a 1-year
        service warranty.
      </p>
    </PolicyPage>
  );
}
