"use client";

import { cn } from "@/lib/utils";

export const cardClass =
  "rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card shadow-[var(--cg-3d-shadow)]";
export const innerCardClass =
  "rounded-xl border-2 border-[var(--cg-3d-border)] bg-white shadow-[2px_2px_0_0_var(--cg-3d-border)]";

type SelectableCardProps = {
  selected?: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  badge?: string;
  className?: string;
};

export function SelectableCard({
  selected,
  onClick,
  title,
  description,
  badge,
  className
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        innerCardClass,
        "w-full p-4 text-left transition hover:-translate-x-px hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600",
        selected &&
          "border-emerald-800 bg-emerald-50 ring-2 ring-emerald-200 shadow-[3px_3px_0_0_#14532d]",
        className
      )}
    >
      {badge ? (
        <span className="mb-2 inline-block rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
          {badge}
        </span>
      ) : null}
      <p className="font-display text-sm font-bold text-cg-text">{title}</p>
      {description ? <p className="mt-1 text-xs leading-relaxed text-cg-muted">{description}</p> : null}
    </button>
  );
}

type ChipProps = {
  label: string;
  selected?: boolean;
  onClick: () => void;
};

export function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600",
        selected
          ? "border-emerald-800 bg-emerald-700 text-white shadow-[2px_2px_0_0_#14532d]"
          : "border-[var(--cg-3d-border)] bg-white text-cg-text hover:-translate-y-px hover:shadow-[2px_2px_0_0_var(--cg-3d-border)]"
      )}
    >
      {label}
    </button>
  );
}

type AddExperienceButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
  fullWidth?: boolean;
};

/** Primary CTA to open the add-experience flow — shared styling across Life Journey. */
export function AddExperienceButton({
  onClick,
  label = "+ Add experience",
  className,
  fullWidth
}: AddExperienceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add experience"
      className={cn(
        "cursor-pointer rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-[3px_3px_0_0_#14532d] transition duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#14532d,0_0_24px_rgba(16,185,129,0.35)] active:translate-x-px active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
        fullWidth && "w-full",
        className
      )}
    >
      {label}
    </button>
  );
}

export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div
      className="flex gap-1.5"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full border border-[var(--cg-3d-border)]",
            i < step ? "bg-emerald-600" : "bg-zinc-100"
          )}
        />
      ))}
    </div>
  );
}
