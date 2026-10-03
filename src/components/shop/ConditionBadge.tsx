import { BadgeCheck } from "lucide-react";
import { conditionLabel } from "@/lib/product";
import type { Condition } from "@/data/products";

export function ConditionBadge({ condition }: { condition: Condition }) {
  const certified = condition === "refurbished";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] px-2 py-0.5 bg-[#F5F5F5] rounded-md border border-[#E5E5E5]">
      {certified && <BadgeCheck className="w-3.5 h-3.5" aria-hidden />}
      {conditionLabel(condition)}
    </span>
  );
}
