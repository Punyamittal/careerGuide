"use client";

import { useEffect, useRef } from "react";
import type { AssessmentEngineInstance } from "@/lib/assessment-engine/createAssessmentGame";
import { createAssessmentGame } from "@/lib/assessment-engine/createAssessmentGame";
import type { PersistedSession } from "@/lib/assessment-engine/configs/module-config.types";
import type { AdaptiveState } from "@/lib/assessment-engine/types";
import type { AssessmentItemProgress } from "@/lib/assessment-engine/types";

export type PhaserHostProps = {
  moduleId: string;
  engineType: string;
  sessionId: string | null;
  onReady?: () => void;
  onEngineReady?: (engine: AssessmentEngineInstance) => void;
  onAdaptiveChange?: (state: AdaptiveState) => void;
  onItemChange?: (progress: AssessmentItemProgress) => void;
  onComplete?: (session: PersistedSession) => void;
};

export function PhaserHost({
  moduleId,
  engineType,
  sessionId,
  onReady,
  onEngineReady,
  onAdaptiveChange,
  onItemChange,
  onComplete
}: PhaserHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AssessmentEngineInstance | null>(null);
  const callbacksRef = useRef({
    onReady,
    onEngineReady,
    onAdaptiveChange,
    onItemChange,
    onComplete
  });

  callbacksRef.current = {
    onReady,
    onEngineReady,
    onAdaptiveChange,
    onItemChange,
    onComplete
  };

  useEffect(() => {
    if (!sessionId || !containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;

    const boot = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (cancelled || !containerRef.current) return;

      try {
        console.log("[PhaserHost] boot", { moduleId, engineType, sessionId });
        const engine = await createAssessmentGame({
          container,
          moduleId,
          engineType: engineType as "likert" | "branching",
          sessionId,
          onReady: () => {
            if (!cancelled) {
              console.log("[PhaserHost] ready", { moduleId });
              callbacksRef.current.onReady?.();
            }
          },
          onAdaptiveChange: (state) => {
            if (cancelled) return;
            queueMicrotask(() => {
              if (cancelled) return;
              callbacksRef.current.onAdaptiveChange?.({
                difficulty: Number(state.difficulty ?? 1),
                streakCorrect: Number(state.streakCorrect ?? 0),
                itemsCompleted: Number(state.itemsCompleted ?? 0)
              });
            });
          },
          onItemChange: (progress) => {
            if (cancelled) return;
            queueMicrotask(() => {
              if (cancelled) return;
              callbacksRef.current.onItemChange?.(progress as AssessmentItemProgress);
            });
          },
          onComplete: (session) => {
            if (cancelled) return;
            queueMicrotask(() => {
              if (cancelled) return;
              console.log("[PhaserHost] complete", { moduleId });
              callbacksRef.current.onComplete?.(session as PersistedSession);
            });
          }
        });
        if (cancelled) {
          engine.destroy();
          return;
        }
        engineRef.current = engine;
        callbacksRef.current.onEngineReady?.(engine);
      } catch (err) {
        console.error("[PhaserHost] init failed", err);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [moduleId, engineType, sessionId]);

  return (
    <div
      ref={containerRef}
      className="relative h-[min(72vh,520px)] min-h-[400px] w-full overflow-hidden rounded-xl border-2 border-[var(--cg-3d-border)] bg-[var(--cg-card,#f8fafc)] shadow-[var(--cg-3d-shadow,0_2px_8px_rgba(0,0,0,0.06))] dark:bg-slate-900 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
      data-engine={engineType}
      data-module={moduleId}
      aria-label={`Assessment module ${moduleId}`}
    />
  );
}
