import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { CardArtKey } from "./card-art";
import { CARD_ART } from "./card-art";

type CardThumbImageProps = {
  variant: CardArtKey;
  alt: string;
  /** Horizontal scroll strip cards */
  compact?: boolean;
  /** Large featured tile */
  tall?: boolean;
  /** Two-column “popular” wide cards (taller header) */
  wide?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * Ghibli-style landscape photography (web) with a gentle overlay — pastoral, calm mood.
 */
export function CardThumbImage({
  variant,
  alt,
  compact,
  tall,
  wide,
  className,
  children
}: CardThumbImageProps) {
  const src = CARD_ART[variant];
  const heightClass = tall
    ? "min-h-[180px] flex-1"
    : wide
      ? "h-[140px]"
      : compact
        ? "h-[88px]"
        : "h-[112px]";

  return (
    <div
      className={cn(
        "relative mb-3 overflow-hidden rounded-xl border-2 border-[var(--cg-3d-border)] bg-zinc-200 shadow-[2px_2px_0_0_var(--cg-3d-border)]",
        heightClass,
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={compact ? "120px" : tall ? "(max-width:768px) 90vw, 400px" : "200px"}
        className="object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-950/25 via-transparent to-sky-100/30 mix-blend-soft-light"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/35" aria-hidden />
      {children}
    </div>
  );
}
