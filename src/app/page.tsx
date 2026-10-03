import type { Metadata } from "next";
import { BrandCarousel } from "@/components/home/BrandCarousel";
import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TrustStrip } from "@/components/home/TrustStrip";

export const metadata: Metadata = {
  title: "Elite Laptops — Better Devices, Greater Possibilities",
};

export default function HomePage() {
  return (
    <>
      <div className="flex flex-col min-h-[calc(100svh-6.25rem)]">
        <Hero />
        <BrandCarousel />
      </div>
      <FeaturedProducts />
      <TrustStrip />
    </>
  );
}
