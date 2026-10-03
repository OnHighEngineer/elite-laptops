import { BRAND_LOGOS, type BrandLogo } from "@/data/brand-logos";

// Every logo is drawn at the same height so wide wordmarks (Lenovo, Samsung) and tall marks (Apple) look balanced.
function Logo({ name, path, viewBox }: BrandLogo) {
  const [, , w, h] = viewBox.split(" ").map(Number);
  const height = 28;
  const width = Math.min(Math.round((w / h) * height), 140);
  return (
    <li className="flex items-center shrink-0 px-6 sm:px-10 text-[#A0A0A0] hover:text-[#111111] transition-colors">
      <svg
        viewBox={viewBox}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        className="fill-current"
        role="img"
        aria-label={name}
      >
        <path d={path} />
      </svg>
    </li>
  );
}

export function BrandCarousel() {
  return (
    <section aria-labelledby="brands-heading" className="bg-white border-y border-[#E5E5E5] py-5 sm:py-7">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-3 sm:mb-4">
        <h2 id="brands-heading" className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#666666]">
          Brands we stock and service
        </h2>
      </div>

      <div className="brand-marquee relative overflow-hidden" role="group" aria-roledescription="carousel" aria-label="Laptop brands">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
        <div className="brand-track flex w-max">
          <ul className="flex items-center shrink-0">
            {BRAND_LOGOS.map((b) => <Logo key={b.name} {...b} />)}
          </ul>
          {/* Duplicate set makes the loop seamless; hidden from assistive tech so brands are not read twice. */}
          <ul className="flex items-center shrink-0" aria-hidden>
            {BRAND_LOGOS.map((b) => <Logo key={b.name} {...b} />)}
          </ul>
        </div>
      </div>
    </section>
  );
}
