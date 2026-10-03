import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";
import { STORE_TERMS } from "@/lib/store-terms";

export const metadata: Metadata = {
  title: "Warranty Policy",
  description: "Every Elite Laptops laptop comes with a 3-month full warranty and 1-year service warranty.",
};

export default function WarrantyPage() {
  return (
    <PolicyPage title="Warranty Policy">
      <p>
        Every certified refurbished laptop we sell includes a{" "}
        <strong className="text-[#111111]">{STORE_TERMS.warrantyMonths}-month full warranty</strong>{" "}
        and a <strong className="text-[#111111]">{STORE_TERMS.serviceMonths / 12}-year service warranty</strong>.
      </p>
      <p>
        If something goes wrong during the warranty period, contact support by email through our
        contact page and we will guide you through the next steps.
      </p>
    </PolicyPage>
  );
}
