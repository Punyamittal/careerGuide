 "use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type InstitutionOverview = {
  classAverages: { metric: string; value: number }[];
  weakAreas: { skill: string; count: number }[];
};

export default function InstitutionReportsPage() {
  const [data, setData] = useState<InstitutionOverview | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await api<InstitutionOverview>("/dashboard/institution/overview");
      if (!cancelled) setData(res.data ?? null);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="space-y-6 px-4 py-6 md:px-8">
      <h1 className="font-display text-3xl text-[var(--primary)]">Institution Reports</h1>
      <section className="rounded-2xl bg-white p-5">
        <p className="text-sm text-[var(--muted)]">
          Export-ready analytics snapshot for counselling meetings and class interventions.
        </p>
        <div className="mt-4 flex gap-3">
          <button type="button" className="rounded-xl bg-[var(--btob)] px-4 py-2 text-sm font-semibold text-white">
            Download Reports ZIP
          </button>
          <button type="button" className="rounded-xl border px-4 py-2 text-sm font-semibold">
            Export CSV
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-3">
            <h2 className="font-semibold text-[var(--primary)]">Performance areas</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {(data?.classAverages ?? []).slice(0, 5).map((item) => (
                <li key={item.metric} className="flex justify-between">
                  <span>{item.metric}</span>
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-3">
            <h2 className="font-semibold text-[var(--primary)]">Intervention priorities</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {(data?.weakAreas ?? []).slice(0, 5).map((item) => (
                <li key={item.skill} className="flex justify-between">
                  <span>{item.skill}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
