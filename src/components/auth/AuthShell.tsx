import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-10 sm:py-16 flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-[#666666]">{subtitle}</p>}
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-8 shadow-sm space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}
