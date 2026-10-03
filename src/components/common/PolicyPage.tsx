import type { ReactNode } from "react";

export function PolicyPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight mb-6">
        {title}
      </h1>
      <div className="space-y-4 text-sm sm:text-base text-[#666666] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
