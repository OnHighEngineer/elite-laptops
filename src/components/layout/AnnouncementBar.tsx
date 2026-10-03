import { STORE_TERMS } from "@/lib/store-terms";

export function AnnouncementBar() {
  return (
    <div className="bg-[#111111] text-white text-[11px] leading-4 sm:text-xs text-center px-3 py-2 whitespace-nowrap overflow-hidden">
      <span className="inline-flex items-center gap-2">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="live-dot-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80]" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" />
        </span>
        <span>
          Free shipping across India · 1 year service warranty
          <span className="hidden sm:inline"> on every laptop</span>
        </span>
      </span>
    </div>
  );
}
