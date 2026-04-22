"use client";

import { useMemo } from "react";
import { IconSearch } from "./icons";

const CATEGORIES = [
  { id: "coding", label: "Coding" },
  { id: "design", label: "Design" },
  { id: "marketing", label: "Marketing" },
  { id: "accounting", label: "Accounting" }
] as const;

/** Match sidebar nav pills (neo-brutalist active / inactive). */
const pillActiveClass =
  "border-2 border-[var(--cg-tab-active-border)] bg-[var(--cg-tab-active-bg)] text-white shadow-[3px_3px_0_0_var(--cg-tab-active-shadow)] ring-2 ring-[var(--cg-tab-active-ring)]";
const pillInactiveClass =
  "border-2 border-[var(--cg-3d-border)] bg-cg-card text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_var(--cg-3d-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--cg-3d-border)]";

export type DashboardHeaderProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  activeCategory: string | null;
  onCategoryChange: (id: string | null) => void;
};

export function DashboardHeader({
  searchQuery,
  onSearchQueryChange,
  activeCategory,
  onCategoryChange
}: DashboardHeaderProps) {
  const filteredLabel = useMemo(() => searchQuery.trim(), [searchQuery]);

  function select(id: string) {
    onCategoryChange(id);
  }

  return (
    <div className="space-y-5">
      <label className="relative flex items-center gap-3 rounded-xl border-2 border-[var(--cg-3d-border)] bg-cg-card px-4 py-2.5 shadow-[var(--cg-3d-shadow)] transition-shadow focus-within:ring-2 focus-within:ring-[var(--cg-tab-active-ring)]">
        <span className="text-cg-muted" aria-hidden>
          <IconSearch className="h-5 w-5" />
        </span>
        <input
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search career paths, skills, guides…"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-cg-text outline-none placeholder:text-cg-muted"
          type="search"
          autoComplete="off"
        />
        {filteredLabel || activeCategory ? (
          <span className="hidden max-w-[40%] truncate text-xs font-medium text-cg-muted sm:inline">
            {activeCategory ? `Category: ${activeCategory}` : null}
            {activeCategory && filteredLabel ? " · " : null}
            {filteredLabel ? `Search: ${filteredLabel}` : null}
          </span>
        ) : null}
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => {
          const isOn = activeCategory === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c.id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-out ${
                isOn ? pillActiveClass : pillInactiveClass
              }`}
            >
              {c.label}
            </button>
          );
        })}
        <button
          type="button"
          className="ml-auto rounded-lg border-2 border-transparent px-3 py-2 text-sm font-semibold text-cg-muted transition-all hover:border-[var(--cg-3d-border)] hover:bg-white hover:text-cg-text hover:shadow-[2px_2px_0_0_var(--cg-3d-border)]"
          onClick={() => {
            onSearchQueryChange("");
            onCategoryChange(null);
          }}
        >
          See all
        </button>
      </div>
    </div>
  );
}
