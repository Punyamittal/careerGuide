 "use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/cireern/ui";
import { api } from "@/lib/api";

type InstitutionOverview = {
  kpis: {
    totalStudents: number;
    activeScoredAttempts30d: number;
    topCareerDomain: string;
  };
  classAverages: { metric: string; value: number }[];
  weakAreas: { skill: string; count: number }[];
};

export default function InstitutionDashboardPage() {
  const [data, setData] = useState<InstitutionOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api<InstitutionOverview>("/dashboard/institution/overview");
        if (!cancelled) setData(res.data ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load institution dashboard.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = data?.kpis;
  return (
    <main className="space-y-6 px-4 py-6 md:px-8">
      <h1 className="font-display text-3xl text-[var(--primary)]">Institution Dashboard</h1>
      <section className="grid gap-3 md:grid-cols-4">
        <KPICard title="Total Students" value={kpis ? String(kpis.totalStudents) : "..."} />
        <KPICard title="Scored Attempts (30d)" value={kpis ? String(kpis.activeScoredAttempts30d) : "..."} />
        <KPICard title="Top Career Domain" value={kpis?.topCareerDomain ?? "..."} />
        <KPICard title="Weak Areas Tracked" value={data ? String(data.weakAreas.length) : "..."} />
      </section>
      {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5">
          <h2 className="font-display text-xl text-[var(--primary)]">Class averages</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.classAverages ?? []).slice(0, 6).map((item) => (
              <li key={item.metric} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span>{item.metric}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl bg-white p-5">
          <h2 className="font-display text-xl text-[var(--primary)]">Top weak areas</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.weakAreas ?? []).map((item) => (
              <li key={item.skill} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span>{item.skill}</span>
                <strong>{item.count} learners</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
