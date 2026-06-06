"use client";

import { useEffect } from "react";
import { SETUP_CONTEXT } from "@/lib/negotiation-npc-v2/scenario";
import { useNegotiationStore } from "@/lib/negotiation-npc-v2/store";
import { NpcDialoguePanel, RoundIndicator } from "./NpcDialoguePanel";
import {
  OfferActionCards,
  ProbeInterestInput,
  TradePackageCards
} from "./OfferActionCards";
import { NegotiationResultSummary } from "./NegotiationResultSummary";
import { TrustMeter } from "./TrustMeter";

export type NegotiationNpcV2SimulationProps = {
  flowSessionId?: string;
  clarificationSessionId?: string;
  autoStart?: boolean;
  onComplete?: (result: NonNullable<ReturnType<typeof useNegotiationStore.getState>["result"]>) => void;
};

export function NegotiationNpcV2Simulation({
  flowSessionId,
  clarificationSessionId,
  autoStart = true,
  onComplete
}: NegotiationNpcV2SimulationProps) {
  const {
    phase,
    session,
    result,
    error,
    loading,
    pendingTradeBranch,
    probeDraft,
    start,
    selectAction,
    selectTradePackage,
    setProbeDraft,
    finish,
    reset
  } = useNegotiationStore();

  useEffect(() => {
    if (autoStart && phase === "idle") {
      void start({ flowSessionId, clarificationSessionId });
    }
  }, [autoStart, phase, start, flowSessionId, clarificationSessionId]);

  useEffect(() => {
    if (phase === "complete" && result) onComplete?.(result);
  }, [phase, result, onComplete]);

  if (phase === "idle" || (loading && !session)) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
        <p className="text-sm text-zinc-500">Loading negotiation simulation…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
        <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          onClick={() => {
            reset();
            void start({ flowSessionId, clarificationSessionId });
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!session) return null;

  const showResults = phase === "complete" && (result ?? session.result);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Negotiation NPC V2</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{SETUP_CONTEXT}</p>
        <RoundIndicator round={session.round} maxRounds={session.maxRounds} />
      </header>

      <TrustMeter trust={session.trust} series={session.trustSeries} />

      {session.batnaRevealed ? (
        <p className="text-xs font-medium text-sky-700 dark:text-sky-300">
          BATNA insight unlocked — quality vs date trade-off revealed
        </p>
      ) : null}

      <NpcDialoguePanel message={session.npcMessage} mood={session.npcMood} />

      {!showResults && !session.sessionComplete ? (
        <div className="space-y-4">
          <ProbeInterestInput
            value={probeDraft}
            onChange={setProbeDraft}
            disabled={loading}
          />

          {pendingTradeBranch ? (
            <TradePackageCards
              packages={session.availableTradePackages}
              disabled={loading}
              onSelect={(pkg) => void selectTradePackage(pkg)}
            />
          ) : (
            <OfferActionCards
              actions={session.availableActions}
              disabled={loading}
              onSelect={(branch) => void selectAction(branch)}
            />
          )}

          {session.sessionComplete ? (
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
              onClick={() => void finish()}
            >
              View scored results
            </button>
          ) : null}
        </div>
      ) : null}

      {showResults ? (
        <NegotiationResultSummary result={(result ?? session.result)!} />
      ) : session.sessionComplete && !result && !session.result ? (
        <button
          type="button"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => void finish()}
        >
          {loading ? "Scoring…" : "Complete & score"}
        </button>
      ) : null}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
