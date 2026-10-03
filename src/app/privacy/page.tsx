import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Elite Laptops handles your information.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy Policy">
      <p>
        This is a short summary. We only use the information you give us, such as your name and
        email address, to respond to your messages and, once checkout is available, to process
        your orders.
      </p>
      <p>
        We do not sell your personal information. A full privacy policy will be published before
        accounts and online payments go live.
      </p>
    </PolicyPage>
  );
}
