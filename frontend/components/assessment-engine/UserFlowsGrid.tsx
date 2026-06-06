"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchUserFlows,
  userFlowHref,
  type UserFlowSummary
} from "@/lib/assessment-engine/user-flow-client";

export function UserFlowsGrid() {
  const [flows, setFlows] = useState<UserFlowSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchUserFlows()
      .then(setFlows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)]">
      <h3 className="font-display text-xl font-bold text-cg-text">MBS user flows (archive)</h3>
      <p className="mt-1 text-sm text-cg-muted">
        Official 6 learner journeys — phased blocks wired to archive question banks (User 1–6).
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-cg-muted">Loading flows…</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <article
              key={flow.key}
              className="flex flex-col rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-4 shadow-[2px_2px_0_0_var(--cg-3d-border)] dark:bg-slate-900/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                  {flow.grade}
                </span>
                <span className="text-[10px] font-semibold text-cg-muted">
                  {flow.durationMin != null ? `~${flow.durationMin} min` : "—"}
                </span>
              </div>
              <p className="mt-2 font-display text-base font-bold text-cg-text">{flow.label}</p>
              <p className="mt-1 line-clamp-3 text-xs text-cg-muted">{flow.purpose ?? flow.delivery}</p>
              <p className="mt-2 text-[11px] text-cg-muted">
                {flow.phaseCount} phases · {flow.selectedItems ?? flow.targetItems ?? "—"} bank items
              </p>
              <div className="mt-auto flex flex-col gap-2 pt-3">
                <Link
                  href={userFlowHref(flow.userFlow)}
                  className="rounded-lg border border-[var(--cg-3d-border)] bg-indigo-800 px-2.5 py-2 text-center text-xs font-semibold text-white"
                >
                  Start journey
                </Link>
                {flow.userFlow === "user-6" ? (
                  <Link
                    href="/user-6/clarification"
                    className="rounded-lg border border-dashed border-[var(--cg-3d-border)] px-2.5 py-1.5 text-center text-[11px] font-semibold text-cg-muted"
                  >
                    Phase 7.5 clarification only
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
