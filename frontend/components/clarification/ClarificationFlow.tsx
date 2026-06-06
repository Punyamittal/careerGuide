"use client";

import { useClarificationFlow } from "@/lib/clarification/hooks";
import type { ClarifyEvaluateResponse, ClarifyNextItem } from "@/lib/clarification/types";

type EvaluatePanelProps = {
  result: ClarifyEvaluateResponse | null;
  loading?: boolean;
  onStart: () => void;
};

export function ClarificationEvaluatePanel({ result, loading, onStart }: EvaluatePanelProps) {
  return (
    <section className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-6 shadow-[4px_4px_0_0_var(--cg-3d-border)]">
      <h2 className="font-display text-xl font-bold text-cg-text">Phase 7.5 — Clarification</h2>
      <p className="mt-2 text-sm text-cg-muted">
        Ambiguity rules U1–U17 evaluate your construct snapshot and route targeted clarification
        journeys before your final report.
      </p>

      {!result ? (
        <button
          type="button"
          disabled={loading}
          onClick={onStart}
          className="mt-4 rounded-lg border-2 border-[var(--cg-3d-border)] bg-cg-accent px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--cg-3d-border)] disabled:opacity-60"
        >
          {loading ? "Evaluating…" : "Run clarification evaluate"}
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          {result.skipped ? (
            <p className="text-sm text-cg-muted">No ambiguity rules fired — proceeding to Phase 8.</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-cg-text">
                Rules fired: {result.firedRules.join(", ")}
              </p>
              <ul className="list-disc pl-5 text-sm text-cg-muted">
                {result.journeys.map((j) => (
                  <li key={j.journeyId}>
                    {j.journeyId} — {j.name} ({j.itemsPlanned.min}–{j.itemsPlanned.max} items)
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}

type ItemCardProps = {
  item: ClarifyNextItem;
  journeyId: string;
  itemsRemaining: number;
  loading?: boolean;
  onSubmit: (optionIndex: number) => void;
};

export function ClarificationItemCard({
  item,
  journeyId,
  itemsRemaining,
  loading,
  onSubmit
}: ItemCardProps) {
  return (
    <section className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-6 shadow-[4px_4px_0_0_var(--cg-3d-border)]">
      <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-cg-muted">
        <span>Journey {journeyId}</span>
        <span>{itemsRemaining} remaining</span>
      </div>
      <p className="text-base leading-relaxed text-cg-text">{item.stem}</p>
      <div className="mt-4 flex flex-col gap-2">
        {item.options.map((option, index) => (
          <button
            key={`${item.itemId}-${index}`}
            type="button"
            disabled={loading}
            onClick={() => onSubmit(index)}
            className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-cg-canvas px-4 py-3 text-left text-sm font-medium text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)] transition hover:-translate-x-px hover:-translate-y-px hover:bg-white disabled:opacity-60"
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

type SimLauncherProps = {
  simConfig: Record<string, unknown> & { simId?: string };
  journeyId: string;
  onComplete: () => void;
};

export function ClarificationSimLauncher({ simConfig, journeyId, onComplete }: SimLauncherProps) {
  const simId = String(simConfig.simId ?? "");

  return (
    <section className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-6 shadow-[4px_4px_0_0_var(--cg-3d-border)]">
      <h3 className="font-display text-lg font-bold text-cg-text">Simulation — {journeyId}</h3>
      <p className="mt-2 text-sm text-cg-muted">
        Complete the injected simulation ({simId}) then continue clarification.
      </p>
      {simId.includes("NEGOTIATION") ? (
        <a
          href="/simulations/negotiation-v2"
          className="mt-4 inline-block rounded-lg border-2 border-[var(--cg-3d-border)] bg-cg-accent px-4 py-2 text-sm font-bold text-white"
        >
          Open Negotiation NPC V2
        </a>
      ) : null}
      <button
        type="button"
        onClick={onComplete}
        className="mt-4 ml-0 block rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-4 py-2 text-sm font-bold text-cg-text"
      >
        Mark simulation complete &amp; continue
      </button>
    </section>
  );
}

type FlowProps = {
  flowSessionId: string;
};

export function ClarificationFlowPanel({ flowSessionId }: FlowProps) {
  const {
    phase,
    loading,
    error,
    evaluateResult,
    currentItem,
    journeyId,
    itemsRemaining,
    simConfig,
    finalizeResult,
    startClarification,
    answerAndContinue,
    continueAfterSim
  } = useClarificationFlow(flowSessionId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {(phase === "idle" || phase === "evaluating") && !evaluateResult ? (
        <ClarificationEvaluatePanel
          result={evaluateResult}
          loading={loading}
          onStart={() => void startClarification()}
        />
      ) : null}

      {phase === "items" && currentItem && journeyId ? (
        <ClarificationItemCard
          item={currentItem}
          journeyId={journeyId}
          itemsRemaining={itemsRemaining}
          loading={loading}
          onSubmit={(idx) => void answerAndContinue(idx)}
        />
      ) : null}

      {phase === "simulation" && simConfig && journeyId ? (
        <ClarificationSimLauncher
          simConfig={simConfig}
          journeyId={journeyId}
          onComplete={() => void continueAfterSim()}
        />
      ) : null}

      {phase === "complete" && finalizeResult ? (
        <section className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-6">
          <h3 className="font-display text-lg font-bold text-cg-text">Clarification complete</h3>
          <p className="mt-2 text-sm text-cg-muted">
            Validity band: <strong>{finalizeResult.validityBand}</strong> — proceeding to Phase 8.
          </p>
        </section>
      ) : null}
    </div>
  );
}
