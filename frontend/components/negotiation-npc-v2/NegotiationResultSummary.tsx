"use client";

import type { NegotiationResultPayload } from "@/lib/negotiation-npc-v2/types";
import { ScorePill } from "./TrustMeter";

export function NegotiationResultSummary({ result }: { result: NegotiationResultPayload }) {
  const d = result.dimension_subscores;
  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Negotiation results</h3>
        <span
          className={
            result.success
              ? "rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          }
        >
          {result.success ? "Success" : "Needs development"} · {result.negotiation_band}
        </span>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">{result.sim_evidence_summary}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <ScorePill label="Trust" value={d.trust_score} highlight />
        <ScorePill label="Joint value" value={d.joint_value_score} highlight />
        <ScorePill label="Assertiveness" value={d.assertiveness_score} />
        <ScorePill label="Relationship" value={d.relationship_score} />
        <ScorePill label="Composite" value={result.composite} highlight />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        <ScorePill label="NEG-INT" value={d["NEG-INT"]} />
        <ScorePill label="NEG-TRADE" value={d["NEG-TRADE"]} />
        <ScorePill label="NEG-REL" value={d["NEG-REL"]} />
        <ScorePill label="NEG-ASSERT" value={d["NEG-ASSERT"]} />
        <ScorePill label="NEG-JV" value={d["NEG-JV"]} />
      </div>

      {result.failure_reasons.length > 0 ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Flags: {result.failure_reasons.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
