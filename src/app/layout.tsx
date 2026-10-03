import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { AccountLink } from "@/components/layout/AccountLink";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Elite Laptops — Certified Refurbished Laptops",
    template: "%s | Elite Laptops",
  },
  description:
    "Buy certified refurbished laptops online with warranty and free shipping across India. Karnataka, India.",
  keywords: ["laptops", "refurbished laptops", "certified refurbished", "buy laptops online", "Karnataka", "Elite Laptops"],
  openGraph: {
    siteName: "Elite Laptops",
    url: "https://www.elitelaptops.in",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-white overflow-x-hidden">
        <CartProvider>
          <AnnouncementBar />
          <Navbar accountSlot={<AccountLink />} />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
