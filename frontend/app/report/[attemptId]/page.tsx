"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RightPanel, type ProgressItem } from "@/components/dashboard/right-panel";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { resolveInternshipSlug } from "@/lib/virtual-internships";

const THUMBS = ["sunset", "ocean", "lavender", "mint"] as const;

const cardClass =
  "rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)] transition hover:shadow-[var(--cg-3d-shadow-hover)]";

/** High-visibility back control — solid fill + hard shadow so it reads as the primary exit. */
const backToDashboardClass =
  "inline-flex items-center gap-2 rounded-xl border-2 border-emerald-950 bg-emerald-700 px-5 py-3 text-base font-extrabold tracking-tight text-white shadow-[5px_5px_0_0_var(--cg-3d-border)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[6px_6px_0_0_var(--cg-3d-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[3px_3px_0_0_var(--cg-3d-border)] dark:border-emerald-300 dark:bg-emerald-600 dark:text-white dark:shadow-[5px_5px_0_0_rgb(0,0,0)] dark:hover:bg-emerald-500";

type Report = {
  _id: string;
  structuredSummary: {
    scores?: Record<string, unknown>;
    topCareers?: { title: string; confidence: number; matchScore?: number; slug?: string }[];
  };
  aiNarrative?: string;
  skillGaps?: { skill: string; priority: string; rationale: string }[];
  topCareers?: { title: string; confidence: number; matchScore?: number; slug?: string }[];
  writingEvaluation?: { score: number; feedback: string };
  aiProvider?: string;
};

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium capitalize text-cg-text">{label}</span>
        <span className="tabular-nums text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          {typeof value === "number" ? Math.round(value) : value}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full border border-[var(--cg-3d-border)] bg-zinc-100 dark:bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-teal-600 transition-all duration-500 ease-out dark:from-emerald-500 dark:to-teal-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function priorityChip(priority: string) {
  const p = priority.toLowerCase();
  if (p === "high")
    return "border-rose-800/40 bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100";
  if (p === "medium")
    return "border-amber-800/40 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100";
  return "border-emerald-800/40 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100";
}

export default function ReportPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const { user, loading } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !attemptId) return;
    api<{ report: Report }>(`/reports/attempts/${attemptId}`)
      .then((res) => setReport(res.data?.report ?? null))
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load report"));
  }, [user, attemptId]);

  const progressItems = useMemo((): ProgressItem[] => {
    const gaps = report?.skillGaps ?? [];
    if (!gaps.length) return [];
    return gaps.slice(0, 4).map((g, i) => ({
      title: g.skill,
      subtitle: g.rationale.length > 72 ? `${g.rationale.slice(0, 72)}…` : g.rationale,
      part: `${g.priority} · focus`,
      progress: [38, 52, 44, 58][i % 4],
      thumb: THUMBS[i % 4]
    }));
  }, [report?.skillGaps]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cg-canvas font-medium text-cg-muted">
        Loading…
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-cg-canvas p-4">
        <main className="mx-auto max-w-lg rounded-2xl border-2 border-red-800 bg-red-50 p-6 text-red-900 shadow-[4px_4px_0_0_rgb(127,29,29)] dark:bg-red-950/40 dark:text-red-100">
          <p className="font-medium">{err}</p>
          <Link href="/dashboard" className={`mt-4 ${backToDashboardClass}`}>
            ← Dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cg-canvas font-medium text-cg-muted">
        Loading report…
      </div>
    );
  }

  const scores = report.structuredSummary?.scores as
    | {
        aptitude?: Record<string, number>;
        personality?: { bigFive?: Record<string, number>; riasec?: Record<string, number> };
        motivation?: Record<string, number>;
      }
    | undefined;

  const main = (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <div className="space-y-4 border-b-2 border-[var(--cg-3d-border)] pb-8">
        <Link href="/dashboard" className={backToDashboardClass}>
          ← Dashboard
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
            Your results
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-cg-text">Career report</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-950 shadow-[2px_2px_0_0_var(--cg-3d-border)] dark:bg-emerald-950/50 dark:text-emerald-100">
              AI: {report.aiProvider ?? "—"}
            </span>
            <span className="text-xs font-medium text-cg-muted">Attempt · {attemptId.slice(0, 8)}…</span>
          </div>
        </div>
      </div>

      {report.aiNarrative ? (
        <section className={cardClass}>
          <h2 className="font-display text-lg font-bold text-cg-text">Insights</h2>
          <div className="mt-4 whitespace-pre-wrap border-l-4 border-emerald-700 pl-4 text-sm font-medium leading-relaxed text-cg-text dark:border-emerald-500">
            {report.aiNarrative}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {scores?.aptitude ? (
          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-cg-text">Aptitude</h2>
            <div className="mt-4 space-y-4">
              {Object.entries(scores.aptitude).map(([k, v]) => (
                <ScoreBar key={k} label={k} value={Number(v)} />
              ))}
            </div>
          </section>
        ) : null}

        {scores?.motivation ? (
          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-cg-text">Motivation</h2>
            <div className="mt-4 space-y-4">
              {Object.entries(scores.motivation).map(([k, v]) => (
                <ScoreBar key={k} label={k} value={Number(v)} />
              ))}
            </div>
          </section>
        ) : null}

        {scores?.personality?.bigFive ? (
          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-cg-text">Personality</h2>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-cg-muted">0–100 scale</p>
            <div className="mt-4 space-y-3">
              {Object.entries(scores.personality.bigFive).map(([k, v]) => (
                <ScoreBar key={k} label={k} value={Number(v)} />
              ))}
            </div>
          </section>
        ) : null}

        {scores?.personality?.riasec ? (
          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-cg-text">Interests</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(scores.personality.riasec).map(([k, v]) => (
                <ScoreBar key={k} label={k} value={Number(v)} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {report.topCareers?.length ? (
        <section className={cardClass}>
          <h2 className="font-display text-lg font-bold text-cg-text">Top career matches</h2>
          <ol className="mt-4 space-y-3">
            {report.topCareers.map((c, i) => {
              const raw = c.matchScore ?? c.confidence ?? 0;
              const display =
                raw <= 1 && raw > 0 ? `${Math.round(raw * 1000) / 10}%` : `${Math.round(Number(raw) * 10) / 10}%`;
              const sim = resolveInternshipSlug(c.slug, c.title);
              return (
                <li
                  key={`${c.title}-${i}`}
                  className="flex flex-col gap-2 rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-3 shadow-[2px_2px_0_0_var(--cg-3d-border)] dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-100 text-sm font-black text-emerald-900 shadow-[2px_2px_0_0_var(--cg-3d-border)] dark:bg-emerald-950 dark:text-emerald-200">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-cg-text">{c.title}</p>
                      <p className="text-xs font-medium text-cg-muted">Match strength · {display}</p>
                    </div>
                  </div>
                  {sim ? (
                    <Link
                      href={`/internship/${encodeURIComponent(sim)}`}
                      className="shrink-0 rounded-lg border-2 border-[var(--cg-3d-border)] bg-amber-50 px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-[2px_2px_0_0_var(--cg-3d-border)] transition hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100"
                    >
                      Virtual internship
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {report.skillGaps?.length ? (
        <section className={cardClass}>
          <h2 className="font-display text-lg font-bold text-cg-text">Skill gaps</h2>
          <ul className="mt-4 space-y-3">
            {report.skillGaps.map((g) => (
              <li
                key={g.skill}
                className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-[#faf7f2] p-4 dark:bg-zinc-900/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-cg-text">{g.skill}</span>
                  <span
                    className={`rounded-md border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-[1px_1px_0_0_var(--cg-3d-border)] ${priorityChip(g.priority)}`}
                  >
                    {g.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-cg-muted">{g.rationale}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.writingEvaluation ? (
        <section className={cardClass}>
          <h2 className="font-display text-lg font-bold text-cg-text">Writing evaluation</h2>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-50 px-5 py-3 text-center shadow-[3px_3px_0_0_var(--cg-3d-border)] dark:bg-emerald-950/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Score
              </p>
              <p className="font-display text-3xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                {report.writingEvaluation.score}
                <span className="text-lg font-semibold text-cg-muted">/100</span>
              </p>
            </div>
            <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-cg-text">
              {report.writingEvaluation.feedback}
            </p>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/overview?tab=assessments"
          className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-[4px_4px_0_0_var(--cg-3d-border)] transition hover:-translate-x-px hover:-translate-y-px hover:bg-emerald-700"
        >
          New assessment
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border-2 border-slate-500 bg-slate-100 px-5 py-3 text-sm font-bold text-slate-800 shadow-[3px_3px_0_0_rgb(71,85,105)] dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );

  const right = (
    <RightPanel
      userName={user?.name || "Explorer"}
      latestTitle="Dashboard"
      latestMeta={report.topCareers?.[0] ? `Also explore: ${report.topCareers[0].title}` : "Courses & mentor chat"}
      latestHref="/dashboard"
      progressItems={progressItems}
    />
  );

  return <DashboardShell right={right}>{main}</DashboardShell>;
}
