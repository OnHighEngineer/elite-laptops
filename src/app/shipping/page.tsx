import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";

export const metadata: Metadata = {
  title: "Shipping",
  description: "Free shipping on every Elite Laptops order across India.",
};

export default function ShippingPage() {
  return (
    <PolicyPage title="Shipping">
      <p>
        We offer <strong className="text-[#111111]">free shipping across India</strong> on every
        laptop.
      </p>
      <p>
        If you have a question about your delivery, send us a message from the contact page.
      </p>
    </PolicyPage>
  );
}
