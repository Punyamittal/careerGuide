"use client";

import Link from "next/link";
import { useMemo } from "react";
import { careerProfiles, cosineSimilarity } from "@/lib/cireern-data";
import { useCireernStore } from "@/lib/cireern-store";
import { resolveInternshipSlug } from "@/lib/virtual-internships";

export default function CareerPage() {
  const skills = useCireernStore((state) => state.skills);
  const matches = useMemo(() => {
    const vector = [
      skills.memory,
      skills.processingSpeed,
      skills.logic,
      skills.balance,
      skills.coordination,
      skills.creativity
    ];
    return careerProfiles
      .map((career) => {
        const requirement = [
          career.required.memory,
          career.required.processingSpeed,
          career.required.logic,
          career.required.balance,
          career.required.coordination,
          career.required.creativity
        ];
        return {
          name: career.name,
          matchPct: Math.round(cosineSimilarity(vector, requirement) * 100)
        };
      })
      .sort((a, b) => b.matchPct - a.matchPct)
      .slice(0, 5);
  }, [skills]);
  const suggestions = useMemo(
    () =>
      matches
        .map((m) => ({ ...m, slug: resolveInternshipSlug(undefined, m.name) }))
        .filter((m) => Boolean(m.slug)),
    [matches]
  );
  const top = suggestions[0];

  return (
    <main className="min-h-screen bg-cg-canvas p-6">
      <section className="mx-auto max-w-4xl rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Career explorer</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-cg-text">Career Simulation Hub</h1>
        <p className="mt-3 text-sm text-cg-muted">
          Open an animated, dynamic day-in-the-life simulation based on your suggested career match.
        </p>

        {top ? (
          <div className="mt-5 rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-cg-text">
              Suggested role: {top.name} ({top.matchPct}% match)
            </p>
            <Link
              href={`/internship/${encodeURIComponent(top.slug as string)}`}
              className="mt-3 inline-block rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--cg-3d-border)]"
            >
              Start dynamic simulation
            </Link>
          </div>
        ) : (
          <p className="mt-5 text-sm text-cg-muted">
            Complete an assessment to unlock suggested-role simulations.
          </p>
        )}

        {suggestions.length > 1 ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {suggestions.slice(1).map((s) => (
              <Link
                key={s.name}
                href={`/internship/${encodeURIComponent(s.slug as string)}`}
                className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)]"
              >
                Simulate {s.name} ({s.matchPct}%)
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/internship"
            className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]"
          >
            Browse all simulations
          </Link>
          <Link
            href="/overview"
            className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-3 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--cg-3d-border)]"
          >
            Back to Overview
          </Link>
        </div>
      </section>
    </main>
  );
}
