"use client";

import {
  PLAYER_ACTION_LABELS,
  TRADE_PACKAGES,
  type NegotiationBranch,
  type TradePackage
} from "@/lib/negotiation-npc-v2/scenario";
import { cn } from "@/lib/utils";

export function OfferActionCards({
  actions,
  disabled,
  onSelect
}: {
  actions: NegotiationBranch[];
  disabled?: boolean;
  onSelect: (branch: NegotiationBranch) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {actions.map((branch) => {
        const meta = PLAYER_ACTION_LABELS[branch];
        return (
          <button
            key={branch}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(branch)}
            className={cn(
              "rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:border-indigo-400 hover:shadow-sm",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500"
            )}
          >
            <div className="font-medium text-zinc-900 dark:text-zinc-100">{meta.label}</div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{meta.description}</div>
          </button>
        );
      })}
    </div>
  );
}

export function TradePackageCards({
  packages,
  disabled,
  onSelect
}: {
  packages: TradePackage[];
  disabled?: boolean;
  onSelect: (pkg: TradePackage) => void;
}) {
  const list = packages.length ? packages : (Object.keys(TRADE_PACKAGES) as TradePackage[]);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Choose a trade package</p>
      <div className="grid gap-2">
        {list.map((pkg) => (
          <button
            key={pkg}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(pkg)}
            className={cn(
              "rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-left text-sm",
              "hover:border-indigo-400 dark:border-indigo-900 dark:bg-indigo-950/20",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {TRADE_PACKAGES[pkg].label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProbeInterestInput({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Optional: summarise their interests before probing (improves NEG-INT scoring)
      </span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="e.g. They need exec visibility on date; quality on must-haves is flexible…"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
      />
    </label>
  );
}
