import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { ConditionBadge } from "@/components/shop/ConditionBadge";
import { BuyBox } from "@/components/shop/BuyBox";
import { warrantyLabel, STORE_TERMS } from "@/lib/store-terms";
import { ImageGallery } from "@/components/shop/ImageGallery";
import { ShareButton } from "@/components/shop/ShareButton";
import { ViewTracker } from "@/components/shop/ViewTracker";

type Props = { params: Promise<{ slug: string }> };


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: p.description,
    openGraph: {
      siteName: "Elite Laptops",
      type: "website",
      title: p.name,
      description: p.description,
      images: [p.image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const terms = {
    warrantyMonths: product.warrantyMonths ?? STORE_TERMS.warrantyMonths,
    serviceMonths: product.serviceMonths ?? STORE_TERMS.serviceMonths,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 lg:pb-10">
      <nav aria-label="Breadcrumb" className="text-xs text-[#666666] mb-3 flex flex-wrap items-center gap-x-1.5">
        <Link href="/" className="inline-flex items-center min-h-11 hover:text-[#111111]">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/shop" className="inline-flex items-center min-h-11 hover:text-[#111111]">Shop</Link>
        <span aria-hidden>/</span>
        <span className="text-[#111111]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <ImageGallery images={product.images?.length ? product.images : [product.image]} alt={product.name} />

        <div className="space-y-6 min-w-0">
          <div className="space-y-3">
            <ConditionBadge condition={product.condition} />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
              {product.name}
            </h1>
            <p className="text-sm sm:text-base text-[#666666] leading-relaxed">
              {product.description}
            </p>
          </div>

          <BuyBox product={product} />
          <ShareButton productId={product.id} title={product.name} />
          <ViewTracker productId={product.id} />

          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="text-sm font-semibold text-[#111111] mb-3">Specifications</h2>
            <dl className="border border-[#E5E5E5] rounded-xl divide-y divide-[#E5E5E5] text-sm">
              {[
                ["Brand", product.brand],
                ["Category", product.category],
                ["Processor", product.specDetails?.processor],
                ["RAM", product.specDetails?.ram],
                ["Storage", product.specDetails?.storage],
                ["Graphics", product.specDetails?.graphics],
                ["Screen", product.specDetails?.screen],
                ["Operating system", product.specDetails?.os],
                ["Battery", product.specDetails?.battery],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-[#666666]">{k}</dt>
                    <dd className="text-[#111111] font-medium text-right">{v}</dd>
                  </div>
                ))}
              {!product.specDetails &&
                product.specs.map((s, i) => (
                  <div key={`${i}-${s}`} className="px-4 py-3 text-[#111111] font-medium">{s}</div>
                ))}
              {(product.extraSpecs ?? []).map((s, i) => (
                <div key={`x${i}-${s}`} className="px-4 py-3 text-[#111111]">{s}</div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="warranty-heading">
            <h2 id="warranty-heading" className="text-sm font-semibold text-[#111111] mb-3">Warranty</h2>
            <div className="border border-[#E5E5E5] rounded-xl px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-[#111111]">{warrantyLabel(terms)}</p>
              {product.warrantyNote && <p className="text-[#666666]">{product.warrantyNote}</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
