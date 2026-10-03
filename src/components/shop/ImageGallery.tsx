"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const count = images.length;

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const next = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setIndex(next);
  };

  // Keep the dot / thumbnail in step with swipes.
  const onScroll = () => {
    const el = scroller.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div className="space-y-3 min-w-0" role="group" aria-roledescription="carousel" aria-label={`${alt} photos`}>
      <div className="relative group">
        <div
          ref={scroller}
          onScroll={onScroll}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
            if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
          }}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2"
        >
          {images.map((src, i) => (
            <div
              key={src}
              className="relative aspect-[4/3] w-full shrink-0 snap-center"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <Image
                src={src}
                alt={i === 0 ? alt : `${alt} - photo ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous photo"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/90 border border-[#E5E5E5] shadow-sm disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === count - 1}
              aria-label="Next photo"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/90 border border-[#E5E5E5] shadow-sm disabled:opacity-0 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
            <p className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs" aria-live="polite">
              {index + 1} / {count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`relative block w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === index ? "border-[#111111]" : "border-[#E5E5E5] hover:border-[#999999]"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
