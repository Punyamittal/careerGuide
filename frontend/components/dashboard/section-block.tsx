"use client";

import type { ReactNode } from "react";

type SectionBlockProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  id?: string;
  children: ReactNode;
};

export function SectionBlock({ title, actionLabel = "See all", onAction, id, children }: SectionBlockProps) {
  return (
    <section id={id} className="mt-8 scroll-mt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-cg-text">{title}</h2>
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-cg-muted transition-colors hover:text-cg-text"
        >
          {actionLabel}
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}
