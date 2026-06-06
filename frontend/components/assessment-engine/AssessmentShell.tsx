"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhaserHost } from "./phaser/PhaserHost";
import { AssessmentModuleReport } from "./AssessmentModuleReport";
import type { AssessmentEngineInstance } from "@/lib/assessment-engine/createAssessmentGame";
import { normalizeModuleConfigKey, primeResolvedEngineType } from "@/lib/assessment-engine/configs/loader";
import type { PersistedSession } from "@/lib/assessment-engine/configs/module-config.types";
import {
  loadPersistedSession
} from "@/lib/assessment-engine/engines/session-persistence";
import { initialAdaptiveState } from "@/lib/assessment-engine/adaptive-router";
import { resolveModule, MODULE_REGISTRY_STUB } from "@/lib/assessment-engine/module-registry";
import { startAssessmentSession } from "@/lib/assessment-engine/telemetry-client";
import type { AdaptiveState, AssessmentItemProgress, AssessmentModule } from "@/lib/assessment-engine/types";
import { api } from "@/lib/api";

type Props = { moduleId: string };

export function AssessmentShell({ moduleId }: Props) {
  const configKey = normalizeModuleConfigKey(moduleId);
  const [mod, setMod] = useState<AssessmentModule | null>(
    () => resolveModule(MODULE_REGISTRY_STUB, moduleId) ?? resolveModule(MODULE_REGISTRY_STUB, configKey) ?? null
  );
  const [resolvedEngineType, setResolvedEngineType] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(initialAdaptiveState);
  const [completed, setCompleted] = useState<PersistedSession | null>(null);
  const [restored, setRestored] = useState(false);
  const [itemProgress, setItemProgress] = useState<AssessmentItemProgress>({
    itemId: null,
    index: 0,
    total: 0,
    isLast: false
  });
  const initRef = useRef<string | null>(null);
  const engineRef = useRef<AssessmentEngineInstance | null>(null);

  useEffect(() => {
    void api<{ modules: AssessmentModule[] }>("/assessment/modules").then((res) => {
      const found =
        resolveModule(res.data?.modules ?? [], moduleId) ??
        resolveModule(res.data?.modules ?? [], configKey);
      if (found) {
        setMod(found);
        if (found.engineType) {
          setResolvedEngineType(found.engineType);
          primeResolvedEngineType(configKey, found.engineType);
        }
      }
    });
  }, [moduleId, configKey]);

  useEffect(() => {
    if (initRef.current === configKey) return;
    initRef.current = configKey;
    setCompleted(null);
    setRestored(false);

    const persisted = loadPersistedSession(configKey);
    if (persisted?.sessionId) {
      setSessionId(persisted.sessionId);
      setAdaptive({
        difficulty: persisted.adaptiveState.difficulty,
        streakCorrect: persisted.adaptiveState.streakCorrect,
        itemsCompleted: persisted.adaptiveState.itemsCompleted
      });
      setRestored(true);
      return;
    }

    void startAssessmentSession(configKey)
      .then((session) => setSessionId(session.id))
      .catch(() => {
        setSessionId(crypto.randomUUID());
      });
  }, [configKey]);

  const onAdaptiveChange = useCallback((state: AdaptiveState) => {
    setAdaptive(state);
  }, []);

  const onComplete = useCallback((session: PersistedSession) => {
    setCompleted(session);
  }, []);

  const onItemChange = useCallback((progress: AssessmentItemProgress) => {
    setItemProgress(progress);
  }, []);

  const onEngineReady = useCallback((engine: AssessmentEngineInstance) => {
    engineRef.current = engine;
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current = null;
    };
  }, [configKey]);

  if (!mod) {
    return (
      <p className="text-sm text-cg-muted">
        Unknown module: {moduleId}.{" "}
        <Link href="/assessments/M1" className="font-semibold text-emerald-800 underline">
          Try M1
        </Link>
      </p>
    );
  }

  if (completed) {
    return (
      <AssessmentModuleReport module={mod} session={completed} configKey={configKey} />
    );
  }

  const engineType = resolvedEngineType ?? mod.engineType;

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold text-cg-text">{mod.title}</h2>
          <p className="text-xs text-cg-muted">
            {engineType} · difficulty {adaptive.difficulty} ·{" "}
            {itemProgress.total > 0
              ? `${itemProgress.index} of ${itemProgress.total} questions`
              : `${adaptive.itemsCompleted} answered`}
            {restored ? " · session restored" : ""}
            {sessionId ? ` · ${sessionId.slice(0, 8)}…` : " · starting…"}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {engineType === "branching" ? (
            <>
              <span className="rounded-full border border-[var(--cg-3d-border)] px-2 py-0.5 text-cg-muted">
                Tap or 1–4
              </span>
              <span className="rounded-full border border-[var(--cg-3d-border)] px-2 py-0.5 text-cg-muted">
                Enter = continue
              </span>
            </>
          ) : (
            <span className="rounded-full border border-[var(--cg-3d-border)] px-2 py-0.5 text-cg-muted">
              Keyboard shortcuts shown below the question
            </span>
          )}
        </div>
      </header>

      {sessionId ? (
        <>
          <PhaserHost
            moduleId={configKey}
            engineType={engineType}
            sessionId={sessionId}
            onEngineReady={onEngineReady}
            onAdaptiveChange={onAdaptiveChange}
            onItemChange={onItemChange}
            onComplete={onComplete}
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            {itemProgress.isLast ? (
              <p className="mr-auto text-xs text-cg-muted">Final question — submit when you&apos;re ready.</p>
            ) : null}
            <button
              type="button"
              className="rounded-xl border-2 border-[var(--cg-3d-border)] px-4 py-2 text-sm font-semibold text-cg-text hover:bg-[var(--cg-card,#f8fafc)]"
              onClick={() => engineRef.current?.previous()}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              onClick={() => engineRef.current?.submit()}
            >
              {itemProgress.isLast ? "Submit assessment" : "Continue"}
            </button>
          </div>
        </>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border-2 border-dashed border-[var(--cg-3d-border)]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
