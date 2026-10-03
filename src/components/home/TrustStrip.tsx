import { BadgeCheck, Lock, RotateCcw, ShieldCheck, Truck, Wrench } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "1-Year Service Warranty",
    desc: "Every laptop is covered for a full year.",
  },
  {
    icon: Wrench,
    title: "1-Year Service Warranty",
    desc: "Free service support for a full year.",
  },
  {
    icon: BadgeCheck,
    title: "Quality Inspected",
    desc: "Every laptop is tested before it ships.",
  },
  {
    icon: RotateCcw,
    title: "Easy Exchange",
    desc: "Faulty or not as described? We will exchange it.",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    desc: "Free delivery across India.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    desc: "Pay safely online at checkout.",
  },
];

export function TrustStrip() {
  return (
    <section className="bg-[#F5F5F5] border-y border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-2xl font-semibold text-[#111111] mb-2">
            Why choose Elite Laptops?
          </h2>
          <p className="text-sm text-[#666666]">
            Buy certified refurbished with confidence.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {ITEMS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white border border-[#E5E5E5] rounded-xl p-4 sm:p-6 shadow-xs"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F5F5F5] rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-[#E5E5E5]">
                <Icon className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="font-semibold text-[#111111] text-[13px] sm:text-sm mb-1">{title}</h3>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
