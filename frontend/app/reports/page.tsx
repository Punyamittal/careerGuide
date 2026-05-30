"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { resolveInternshipSlug } from "@/lib/virtual-internships";

const cardClass =
  "rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]";
const chartPalette = ["#059669", "#14b8a6", "#3b82f6", "#8b5cf6", "#f97316", "#f59e0b"];

function toPercent(value: number) {
  return `${Math.round(Number(value) || 0)}%`;
}

type ReportSummaryItem = { _id: string };
type TopCareer = { title: string; slug?: string; matchScore?: number; confidence?: number };
type LatestReport = {
  structuredSummary?: {
    scores?: Record<string, unknown>;
    confidenceScore?: number;
    gameSummary?: { totals?: GameTotals };
    simulationSummary?: { totals?: SimulationTotals };
  };
  topCareers?: TopCareer[];
  skillGaps?: Array<{ skill: string }>;
};
type GameTotals = { sessions: number; actions: number; actionAccuracy: number };
type GameSummary = { totals?: GameTotals };
type SimulationTotals = { sessions: number; avgCompletionScore: number; topTone: string };
type SimulationSummary = { totals?: SimulationTotals };

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [latestReport, setLatestReport] = useState<LatestReport | null>(null);
  const [gameSummary, setGameSummary] = useState<GameSummary | null>(null);
  const [simulationSummary, setSimulationSummary] = useState<SimulationSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCombined() {
      setLoading(true);
      setErr(null);
      try {
        const [reportsResult, gameResult, simulationResult] = await Promise.allSettled([
          api<{ reports?: ReportSummaryItem[] }>("/reports"),
          api<GameSummary>("/games/summary"),
          api<SimulationSummary>("/simulations/summary")
        ]);
        if (cancelled) return;

        const reportsRes = reportsResult.status === "fulfilled" ? reportsResult.value : null;
        const gameRes = gameResult.status === "fulfilled" ? gameResult.value : null;
        const simulationRes = simulationResult.status === "fulfilled" ? simulationResult.value : null;

        setGameSummary(gameRes?.data ?? null);
        setSimulationSummary(simulationRes?.data ?? null);

        if (reportsRes) {
          const latestId = reportsRes.data?.reports?.[0]?._id;
          if (latestId) {
            const detailRes = await api<{ report: LatestReport }>(`/reports/${latestId}`);
            if (!cancelled) setLatestReport(detailRes.data?.report ?? null);
          } else {
            setLatestReport(null);
          }
        }
      } catch (error) {
        if (!cancelled) setErr(error instanceof Error ? error.message : "Failed to load reports");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCombined();
    return () => {
      cancelled = true;
    };
  }, []);

  const topCareers = useMemo(() => latestReport?.topCareers ?? [], [latestReport]);
  const skillGaps = useMemo(() => latestReport?.skillGaps ?? [], [latestReport]);
  const combined = useMemo(
    () => ({
      assessment: {
        scores: latestReport?.structuredSummary?.scores ?? {},
        confidence: latestReport?.structuredSummary?.confidenceScore ?? 0,
        topCareers
      },
      games: gameSummary?.totals ?? latestReport?.structuredSummary?.gameSummary?.totals ?? null,
      simulation: simulationSummary?.totals ?? latestReport?.structuredSummary?.simulationSummary?.totals ?? null
    }),
    [gameSummary?.totals, latestReport?.structuredSummary?.confidenceScore, latestReport?.structuredSummary?.gameSummary?.totals, latestReport?.structuredSummary?.scores, latestReport?.structuredSummary?.simulationSummary?.totals, simulationSummary?.totals, topCareers]
  );
  const aptitudePieData = useMemo(() => {
    const aptitude = (latestReport?.structuredSummary?.scores as { aptitude?: Record<string, number> } | undefined)?.aptitude ?? {};
    return Object.entries(aptitude)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [latestReport?.structuredSummary?.scores]);

  const gameBarData = useMemo(() => {
    const games = combined.games;
    const simulation = combined.simulation;
    return [
      { name: "Game sessions", value: Number(games?.sessions ?? 0) },
      { name: "Total actions", value: Number(games?.actions ?? 0) },
      { name: "Action accuracy", value: Number(games?.actionAccuracy ?? 0) },
      { name: "Sim sessions", value: Number(simulation?.sessions ?? 0) },
      { name: "Sim completion", value: Number(simulation?.avgCompletionScore ?? 0) }
    ];
  }, [combined.games, combined.simulation]);

  return (
    <main className="min-h-screen bg-cg-canvas p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Combined report</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-cg-text">Assessment + Games + Simulation</h1>
          {loading ? <p className="mt-3 text-sm text-cg-muted">Loading combined report...</p> : null}
          {err ? <p className="mt-3 text-sm text-red-700">{err}</p> : null}
          {!loading && !latestReport ? (
            <p className="mt-3 text-sm text-cg-muted">
              No assessment report found yet. Complete an assessment, then play games and simulation to build the combined view.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/overview?tab=assessments" className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-3 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--cg-3d-border)]">
              Take/retake assessment
            </Link>
            <Link href="/play" className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]">Play games</Link>
            <Link href="/internship" className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]">Run simulation</Link>
            <Link href="/overview" className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]">
              Back to Overview
            </Link>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className={cardClass}>
            <h2 className="font-display text-xl font-bold text-cg-text">Assessment summary</h2>
            <ul className="mt-3 space-y-2 text-sm text-cg-muted">
              <li>Confidence: {toPercent(combined.assessment.confidence)}</li>
              <li>Top careers: {topCareers.length ? topCareers.slice(0, 3).map((c) => c.title).join(", ") : "N/A"}</li>
              <li>Skill gaps identified: {skillGaps.length}</li>
            </ul>
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-xl font-bold text-cg-text">Game performance summary</h2>
            <ul className="mt-3 space-y-2 text-sm text-cg-muted">
              <li>Sessions: {combined.games?.sessions ?? 0}</li>
              <li>Total actions: {combined.games?.actions ?? 0}</li>
              <li>Action accuracy: {toPercent(combined.games?.actionAccuracy ?? 0)}</li>
            </ul>
          </section>
        </div>

        <section className={cardClass}>
          <h2 className="font-display text-xl font-bold text-cg-text">Career simulation summary</h2>
          <p className="mt-2 text-sm text-cg-muted">
            Simulation sessions: {combined.simulation?.sessions ?? 0}
          </p>
          <p className="mt-2 text-sm text-cg-muted">
            Average completion score: {toPercent(combined.simulation?.avgCompletionScore ?? 0)} · Decision tone: {combined.simulation?.topTone ?? "N/A"}
          </p>
        </section>

        <section className={cardClass}>
          <h2 className="font-display text-xl font-bold text-cg-text">Visual analytics</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-gradient-to-br from-emerald-50 to-cyan-50 p-3">
              <p className="text-sm font-semibold text-cg-text">Assessment aptitude mix</p>
              <div className="mt-2 h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={aptitudePieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={44}
                      outerRadius={84}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                      labelLine={false}
                    >
                      {aptitudePieData.map((item, index) => (
                        <Cell key={`${item.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Math.round(Number(value ?? 0))}`, "Score"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-gradient-to-br from-sky-50 to-indigo-50 p-3">
              <p className="text-sm font-semibold text-cg-text">Game + simulation signals</p>
              <div className="mt-2 h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gameBarData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} height={42} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Math.round(Number(value ?? 0))}`} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {gameBarData.map((item, index) => (
                        <Cell key={`${item.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {topCareers.length ? (
          <section className={cardClass}>
            <h2 className="font-display text-xl font-bold text-cg-text">Career recommendations</h2>
            <div className="mt-3 space-y-3">
              {topCareers.slice(0, 5).map((career) => (
                <article key={career.title} className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-cg-text">{career.title}</p>
                  <p className="text-xs font-semibold text-cg-muted">
                    Match {toPercent((career.matchScore ?? career.confidence ?? 0) <= 1 ? (career.matchScore ?? career.confidence ?? 0) * 100 : career.matchScore ?? career.confidence ?? 0)}
                  </p>
                </div>
                {resolveInternshipSlug(career.slug, career.title) ? (
                  <Link
                    href={`/internship/${encodeURIComponent(resolveInternshipSlug(career.slug, career.title) as string)}`}
                    className="mt-3 inline-block rounded-lg border-2 border-[var(--cg-3d-border)] bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-950 shadow-[2px_2px_0_0_var(--cg-3d-border)]"
                  >
                    Open Career Match
                  </Link>
                ) : null}
              </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
