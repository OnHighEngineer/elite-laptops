import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using the Elite Laptops website.",
};

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service">
      <p>
        This is a short summary. By using this website you agree to use it lawfully and to give
        accurate information when you contact us or place an order.
      </p>
      <p>
        Warranty, exchange and shipping are described on their own pages. Full terms will be
        published before accounts and online payments go live.
      </p>
    </PolicyPage>
  );
}
