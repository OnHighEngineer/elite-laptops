import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Kept for compatibility; the card no longer tilts. */
  max?: number;
  glare?: boolean;
}

/** Calm card: a small lift and shadow on hover, no 3D tilt or springs. */
export function TiltCard({ children, className }: TiltCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}
