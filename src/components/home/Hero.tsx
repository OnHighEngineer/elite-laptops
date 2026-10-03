import Link from "next/link";
import { ArrowRight, BadgeCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: "1 year service warranty" },
  { icon: BadgeCheck, label: "Quality inspected" },
  { icon: RotateCcw, label: "Easy exchange" },
  { icon: Truck, label: "Free shipping" },
];

export function Hero() {
  return (
    <section className="relative w-full flex-1 bg-gradient-to-b from-[#F5F5F5] to-white flex items-center justify-center py-5 sm:py-8">
      <div className="w-full max-w-4xl mx-auto px-4 text-center">
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#E5E5E5] rounded-full mb-3 sm:mb-5 bg-white shadow-xs">
            <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-bold tracking-wider uppercase rounded-full">
              NEW
            </span>
            <span className="text-xs font-medium text-[#666666]">Karnataka&apos;s Trusted Laptop Store</span>
          </div>

          <h1 className="text-[clamp(1.75rem,min(6vw,7.5vh),4.5rem)] font-bold text-[#111111] tracking-tight leading-[1.1] mb-3 sm:mb-4 max-w-3xl">
            Better devices,
            <br />
            greater possibilities
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#666666] mb-4 sm:mb-6 max-w-xl leading-relaxed">
            Discover top-brand certified refurbished laptops. Guaranteed quality, warranty protection, and free
            delivery across India.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              id="hero-shop-now"
              href="/shop"
              className="inline-flex items-center gap-2 px-8 min-h-12 bg-[#111111] text-white text-sm font-semibold rounded-full hover:bg-[#111111]/85 transition-colors shadow-sm"
            >
              Shop Laptops
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>

          <ul className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs sm:text-sm [@media(max-height:700px)]:hidden text-[#666666]">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center justify-center gap-2">
                <Icon className="w-4 h-4 text-[#111111] shrink-0" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
