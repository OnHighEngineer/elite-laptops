import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch for orders, warranty or exchanges. We reply by email. Based in Karnataka, India.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-12 pb-20 px-4 flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-lg mx-auto text-center space-y-8">
        {/* Header Title & Subtitle centered */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight mb-3">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base text-[#666666] leading-relaxed max-w-md mx-auto">
            Send us a message and we will get back to you by email.
          </p>
        </div>

        {/* Form Container centered */}
        <ContactForm />
      </div>
    </div>
  );
}
