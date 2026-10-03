import Link from "next/link";
import { MapPin, Globe } from "lucide-react";
import { EliteLogo } from "@/components/common/Logo";
import { SubscribeForm } from "@/components/common/SubscribeForm";
import { STORE_ADDRESS, STORE_GSTIN } from "@/lib/store-terms";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop Laptops" },
  { href: "/contact", label: "Contact Support" },
];

const POLICIES = [
  { href: "/about", label: "About Us" },
  { href: "/warranty", label: "Warranty Policy" },
  { href: "/exchange", label: "Exchange Policy" },
  { href: "/shipping", label: "Shipping" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function Footer() {
  return (
    <footer className="bg-[#111111] text-white border-t border-[#222222] pb-6 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-x-6 md:gap-x-8 gap-y-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <EliteLogo className="w-10 h-10 shrink-0" />
              <div>
                <span className="font-bold text-white text-base block tracking-tight">
                  Elite Laptops &amp; Solutions
                </span>
                <span className="text-[11px] text-[#888888] font-mono">
                  GSTIN: {STORE_GSTIN}
                </span>
              </div>
            </div>
            <p className="text-sm text-[#999999] leading-relaxed max-w-sm mb-5">
              Karnataka&apos;s trusted destination for quality-checked, certified refurbished laptops. Best prices, expert guidance, and fast support.
            </p>
            <div className="max-w-sm">
              <SubscribeForm />
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-4">
              Quick Links
            </p>
            <ul className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex items-center min-h-11 lg:min-h-9 text-sm text-[#999999] hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-4">
              Policies
            </p>
            <ul className="flex flex-col gap-1">
              {POLICIES.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex items-center min-h-11 lg:min-h-9 text-sm text-[#999999] hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-4">
              Store Location
            </p>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="https://www.elitelaptops.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 min-h-11 text-sm text-[#999999] hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4 mt-0.5 shrink-0 text-white" />
                  <span>www.elitelaptops.in</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-[#999999] leading-relaxed">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white" />
                <span>
                  {STORE_ADDRESS}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#555555]">
            &copy; {new Date().getFullYear()} Elite Laptops &amp; Solutions. All rights reserved.
          </p>
          <p className="text-xs text-[#555555]">Bangalore, Karnataka, India</p>
        </div>
      </div>
    </footer>
  );
}
