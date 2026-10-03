import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Everyone else (signed out or not the admin) sees the normal 404, so the page's existence isn't revealed.
  if (!(await isAdmin())) notFound();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <nav aria-label="Admin" className="flex gap-1 mb-6 border-b border-[#E5E5E5]">
        {[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/orders", label: "Orders" },
          { href: "/admin/products", label: "Laptops" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="inline-flex items-center min-h-11 px-4 text-sm font-medium text-[#111111] hover:bg-[#F5F5F5] rounded-t-lg">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
