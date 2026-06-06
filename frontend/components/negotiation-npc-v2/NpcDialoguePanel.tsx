"use client";

import type { NpcMood } from "@/lib/negotiation-npc-v2/types";
import { cn } from "@/lib/utils";

const MOOD_STYLES: Record<NpcMood, string> = {
  neutral: "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900",
  open: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30",
  firm: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
  positive: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
  negative: "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30"
};

export function NpcDialoguePanel({
  message,
  mood,
  stakeholderName = "Alex (Product Stakeholder)"
}: {
  message: string;
  mood: NpcMood;
  stakeholderName?: string;
}) {
  return (
    <div className={cn("relative rounded-xl border p-4 shadow-sm", MOOD_STYLES[mood])}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {stakeholderName}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
        {message}
      </p>
    </div>
  );
}

export function RoundIndicator({ round, maxRounds }: { round: number; maxRounds: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="font-medium text-zinc-800 dark:text-zinc-200">
        Round {Math.min(round, maxRounds)} / {maxRounds}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: maxRounds }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-6 rounded-full",
              i < round ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
            )}
          />
        ))}
      </div>
    </div>
  );
}
