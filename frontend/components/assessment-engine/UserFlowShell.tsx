"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhaserHost } from "./phaser/PhaserHost";
import type { AssessmentEngineInstance } from "@/lib/assessment-engine/createAssessmentGame";
import { primeResolvedEngineType } from "@/lib/assessment-engine/configs/loader";
import type { PersistedSession } from "@/lib/assessment-engine/configs/module-config.types";
import {
  fetchUserFlow,
  type UserFlowBlock,
  type UserFlowDetail
} from "@/lib/assessment-engine/user-flow-client";
import { startAssessmentSession } from "@/lib/assessment-engine/telemetry-client";

type Progress = {
  phaseIndex: number;
  blockIndex: number;
  completedKeys: string[];
};

type Props = { userFlow: string };

function loadProgress(userFlow: string): Progress {
  if (typeof window === "undefined") {
    return { phaseIndex: 0, blockIndex: 0, completedKeys: [] };
  }
  try {
    const raw = localStorage.getItem(`mbs-user-flow:${userFlow}`);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    /* ignore */
  }
  return { phaseIndex: 0, blockIndex: 0, completedKeys: [] };
}

function saveProgress(userFlow: string, progress: Progress) {
  localStorage.setItem(`mbs-user-flow:${userFlow}`, JSON.stringify(progress));
}

function blockKey(phaseIndex: number, blockIndex: number) {
  return `${phaseIndex}-${blockIndex}`;
}

function gameModuleHref(block: UserFlowBlock): string | null {
  const pool = (block.pool ?? "").toLowerCase();
  if (pool.includes("game:m11") || block.gameModule?.includes("Go/No-Go")) return "/assessments/T5";
  if (pool.includes("game:m22") || block.gameModule?.includes("Trace")) return "/assessments/T4";
  if (pool.includes("game:m4")) return "/assessments/M4";
  return null;
}

export function UserFlowShell({ userFlow }: Props) {
  const [flow, setFlow] = useState<UserFlowDetail | null>(null);
  const [progress, setProgress] = useState<Progress>(() => loadProgress(userFlow));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<AssessmentEngineInstance | null>(null);

  useEffect(() => {
    void fetchUserFlow(userFlow)
      .then((f) => {
        if (!f) setError("User flow not found");
        else setFlow(f);
      })
      .catch(() => setError("Failed to load user flow"));
  }, [userFlow]);

  const currentBlock = useMemo(() => {
    if (!flow) return null;
    return flow.phases[progress.phaseIndex]?.blocks[progress.blockIndex] ?? null;
  }, [flow, progress]);

  useEffect(() => {
    if (!currentBlock?.playable) {
      setSessionId(null);
      return;
    }
    primeResolvedEngineType(currentBlock.moduleId, "likert");
    void startAssessmentSession(currentBlock.moduleId)
      .then((s) => setSessionId(s.id))
      .catch(() => setSessionId(crypto.randomUUID()));
  }, [currentBlock?.moduleId, currentBlock?.playable]);

  const advance = useCallback(
    (fromKey?: string) => {
      if (!flow) return;
      const key = fromKey ?? blockKey(progress.phaseIndex, progress.blockIndex);
      const completedKeys = progress.completedKeys.includes(key)
        ? progress.completedKeys
        : [...progress.completedKeys, key];

      let pi = progress.phaseIndex;
      let bi = progress.blockIndex + 1;

      while (pi < flow.phases.length) {
        const phase = flow.phases[pi];
        if (bi < phase.blocks.length) break;
        pi += 1;
        bi = 0;
      }

      const next = { phaseIndex: pi, blockIndex: bi, completedKeys };
      setProgress(next);
      saveProgress(userFlow, next);
    },
    [flow, progress, userFlow]
  );

  const onComplete = useCallback(
    (_session: PersistedSession) => {
      advance();
    },
    [advance]
  );

  const onEngineReady = useCallback((engine: AssessmentEngineInstance) => {
    engineRef.current = engine;
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-700">
        {error}.{" "}
        <Link href="/overview?tab=assessments" className="underline">
          Back to assessments
        </Link>
      </p>
    );
  }

  if (!flow) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const done = progress.phaseIndex >= flow.phases.length;
  const totalBlocks = flow.stats.totalBlocks;
  const doneCount = progress.completedKeys.length;

  if (done) {
    return (
      <div className="space-y-4 rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6">
        <h2 className="font-display text-xl font-bold text-cg-text">Journey complete</h2>
        <p className="text-sm text-cg-muted">
          You finished {flow.label}. {flow.report ?? "Your persona report will reflect blocks completed in this session."}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg bg-indigo-800 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              const reset = { phaseIndex: 0, blockIndex: 0, completedKeys: [] };
              setProgress(reset);
              saveProgress(userFlow, reset);
            }}
          >
            Restart journey
          </button>
          <Link
            href="/overview?tab=assessments"
            className="rounded-lg border border-[var(--cg-3d-border)] px-4 py-2 text-sm font-semibold"
          >
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  if (!currentBlock) {
    return <p className="text-sm text-cg-muted">No block at current position.</p>;
  }

  const gameHref = gameModuleHref(currentBlock);

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">{flow.label}</p>
        <h2 className="font-display text-lg font-bold text-cg-text">{currentBlock.phase}</h2>
        <p className="mt-1 text-sm text-cg-muted">
          Block: {currentBlock.block} · {doneCount}/{totalBlocks} completed
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-indigo-700 transition-all"
            style={{ width: `${Math.min(100, (doneCount / Math.max(1, totalBlocks)) * 100)}%` }}
          />
        </div>
      </header>

      {currentBlock.deliveryType === "clarification" ? (
        <section className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-5">
          <p className="text-sm text-cg-text">
            Adaptive clarification phase — resolves ambiguous construct scores before final report.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/user-6/clarification"
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"
            >
              Open clarification
            </Link>
            <button
              type="button"
              className="rounded-lg border border-[var(--cg-3d-border)] px-4 py-2 text-sm font-semibold"
              onClick={() => advance()}
            >
              Skip for now
            </button>
          </div>
        </section>
      ) : null}

      {currentBlock.deliveryType === "game" || currentBlock.deliveryType === "narrative" || currentBlock.deliveryType === "intake" ? (
        <section className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-5">
          <p className="text-xs font-semibold uppercase text-cg-muted">{currentBlock.format}</p>
          <p className="mt-2 text-sm text-cg-text">
            {currentBlock.gameModule
              ? `Interactive module: ${currentBlock.gameModule}`
              : currentBlock.deliveryType === "intake"
                ? "Intake and consent — complete onboarding context before scored blocks."
                : "Narrative or unscored warm-up — continue when ready."}
          </p>
          {currentBlock.adaptive ? (
            <p className="mt-2 text-xs text-cg-muted">Adaptive: {currentBlock.adaptive}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {gameHref ? (
              <Link href={gameHref} className="rounded-lg bg-indigo-800 px-4 py-2 text-sm font-semibold text-white">
                Open game module
              </Link>
            ) : null}
            <button
              type="button"
              className="rounded-lg border border-[var(--cg-3d-border)] px-4 py-2 text-sm font-semibold"
              onClick={() => advance()}
            >
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {currentBlock.playable && sessionId ? (
        <>
          <PhaserHost
            moduleId={currentBlock.moduleId}
            engineType="likert"
            sessionId={sessionId}
            onEngineReady={onEngineReady}
            onComplete={onComplete}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border-2 border-[var(--cg-3d-border)] px-4 py-2 text-sm font-semibold"
              onClick={() => engineRef.current?.previous()}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-xl bg-indigo-800 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => engineRef.current?.submit()}
            >
              Continue
            </button>
          </div>
        </>
      ) : null}

      {currentBlock.deliveryType === "items" && !currentBlock.playable ? (
        <section className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-950">
          <p>
            This block references {currentBlock.itemIds.length} item(s) but none are renderable in the web
            Likert engine yet ({currentBlock.missingIds.length} missing from bank).
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg border border-amber-600 px-3 py-1.5 text-xs font-semibold"
            onClick={() => advance()}
          >
            Skip block
          </button>
        </section>
      ) : null}

      {currentBlock.deliveryType === "placeholder" ? (
        <section className="rounded-xl border border-dashed p-4 text-sm text-cg-muted">
          <p>Placeholder block — no items or game wired.</p>
          <button type="button" className="mt-2 text-xs font-semibold underline" onClick={() => advance()}>
            Continue
          </button>
        </section>
      ) : null}
    </div>
  );
}
