"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { PersistedSession } from "@/lib/assessment-engine/configs/module-config.types";
import { clearPersistedSession } from "@/lib/assessment-engine/engines/session-persistence";
import type { AssessmentModule } from "@/lib/assessment-engine/types";
import { api } from "@/lib/api";

type BackendScore = {
  construct_scores?: Record<string, number>;
  summary?: { accuracy?: number; meanRt?: number; eventCount?: number };
  accuracy?: number;
};

type Props = {
  module: AssessmentModule;
  session: PersistedSession;
  configKey: string;
};

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-cg-text">{label}</span>
        <span className="tabular-nums text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          {Math.round(value)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full border border-[var(--cg-3d-border)] bg-zinc-100 dark:bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-teal-600 transition-all duration-700 ease-out dark:from-emerald-500 dark:to-teal-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const secs = Math.max(1, Math.round(ms / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

export function AssessmentModuleReport({ module, session, configKey }: Props) {
  const reportRef = useRef<HTMLElement>(null);
  const summary = session.sessionSummary;
  const analytics = session.sessionAnalytics;
  const responseCount = Object.keys(session.answers).length;

  useEffect(() => {
    reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!session.sessionId) return;
    void api<{ score: BackendScore }>(`/assessment/sessions/${session.sessionId}/score`, {
      method: "POST",
      body: "{}"
    }).catch(() => undefined);
  }, [session.sessionId]);

  const scoreEntries = summary?.categoryScores
    ? Object.entries(summary.categoryScores).sort((a, b) => b[1] - a[1])
    : [];
  const scoreMax = scoreEntries.length
    ? Math.max(...scoreEntries.map(([, v]) => v), 0.01)
    : 100;

  const reportTitle =
    module.engineType === "branching" ? "Scenario report" : "Motivation report";

  return (
    <section
      ref={reportRef}
      className="space-y-5 rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)]"
      aria-live="polite"
    >
      <header className="space-y-1 border-b border-[var(--cg-3d-border)] pb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
          Assessment complete
        </p>
        <h2 className="font-display text-2xl font-bold text-cg-text">{reportTitle}</h2>
        <p className="text-sm text-cg-muted">
          {module.title} · {module.productCode} · {responseCount} responses ·{" "}
          {formatDuration(summary?.completionTimeMs ?? session.elapsedMs)}
        </p>
      </header>

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--cg-3d-border)] bg-white p-4 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase text-cg-muted">Dominant pattern</p>
              <p className="mt-1 font-display text-lg font-bold text-cg-text">{summary.dominantPattern}</p>
            </div>
            <div className="rounded-xl border border-[var(--cg-3d-border)] bg-white p-4 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase text-cg-muted">Consistency</p>
              <p className="mt-1 font-display text-lg font-bold text-cg-text">
                {Math.round(summary.consistencyScore * 100)}%
              </p>
            </div>
            <div className="rounded-xl border border-[var(--cg-3d-border)] bg-white p-4 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase text-cg-muted">
                {module.engineType === "branching" ? "Scenarios" : "Items"}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-cg-text">
                {module.engineType === "branching" && summary.scenariosTotal
                  ? `${summary.scenariosCompleted ?? responseCount} / ${summary.scenariosTotal}`
                  : responseCount}
              </p>
            </div>
          </div>

          {summary.insights && summary.insights.length > 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-sm font-semibold text-cg-text">Key takeaways</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-cg-muted">
                {summary.insights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.topTendencies.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-cg-text">Top tendencies</p>
              <p className="text-sm text-cg-muted">{summary.topTendencies.join(" · ")}</p>
            </div>
          ) : null}

          {scoreEntries.length > 0 ? (
            <div className="space-y-3 rounded-xl border border-[var(--cg-3d-border)] bg-[var(--cg-card,#f8fafc)] p-4 dark:bg-slate-900/50">
              <p className="text-sm font-semibold text-cg-text">Score breakdown</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {scoreEntries.slice(0, 8).map(([label, value]) => (
                  <ScoreBar key={label} label={label} value={value} max={scoreMax} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-cg-muted">
          Your responses were saved. Summary is being processed — refresh if this persists.
        </p>
      )}

      {analytics ? (
        <p className="text-xs text-cg-muted">
          Avg response {formatDuration(analytics.avgResponseTimeMs)} · {analytics.answerChangeCount}{" "}
          answer changes · {analytics.hesitationCount} deliberate items · difficulty reached{" "}
          {session.adaptiveState.difficulty}
        </p>
      ) : null}

      {module.constructTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {module.constructTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--cg-3d-border)] px-2 py-0.5 text-[10px] font-semibold uppercase text-cg-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-[var(--cg-3d-border)] pt-4">
        <Link
          href={`/assessments/${module.productCode}`}
          className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          onClick={() => clearPersistedSession(configKey)}
        >
          Play again
        </Link>
        <Link
          href="/overview?tab=assessments"
          className="rounded-xl border-2 border-[var(--cg-3d-border)] px-4 py-2 text-sm font-semibold"
        >
          More assessments
        </Link>
        <Link
          href="/overview?tab=career-matches"
          className="rounded-xl border-2 border-[var(--cg-3d-border)] px-4 py-2 text-sm font-semibold"
        >
          Career matches
        </Link>
      </div>
    </section>
  );
}
