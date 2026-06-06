"use client";

import { cn } from "@/lib/utils";

export function TrustMeter({
  trust,
  series,
  className
}: {
  trust: number;
  series?: number[];
  className?: string;
}) {
  const pct = Math.round(trust * 100);
  const tone =
    trust >= 0.65 ? "bg-emerald-500" : trust >= 0.45 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">NPC trust</span>
        <span className="tabular-nums text-zinc-600 dark:text-zinc-400">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className={cn("h-full transition-all duration-500", tone)} style={{ width: `${pct}%` }} />
      </div>
      {series && series.length > 1 ? (
        <div className="flex h-8 items-end gap-0.5" aria-hidden>
          {series.map((point, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-zinc-400/60 dark:bg-zinc-500/60"
              style={{ height: `${Math.max(8, point * 100)}%` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ScorePill({
  label,
  value,
  highlight
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-center",
        highlight
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      )}
    >
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{Math.round(value * 100)}%</div>
    </div>
  );
}
