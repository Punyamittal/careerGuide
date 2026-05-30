"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasModuleConfig } from "@/lib/assessment-engine/configs/loader";
import {
  listMotivationModules,
  MODULE_REGISTRY_STUB
} from "@/lib/assessment-engine/module-registry";
import type { AssessmentModule } from "@/lib/assessment-engine/types";
import { api } from "@/lib/api";

export function MotivationModulesGrid() {
  const [modules, setModules] = useState<AssessmentModule[]>(() =>
    listMotivationModules(MODULE_REGISTRY_STUB)
  );

  useEffect(() => {
    void api<{ modules: AssessmentModule[] }>("/assessment/modules").then((res) => {
      const stubMotivation = listMotivationModules(MODULE_REGISTRY_STUB);
      const merged = new Map(stubMotivation.map((m) => [m.id, m]));
      for (const m of res.data?.modules ?? []) {
        if (!/^M(0?[1-9]|1[0-2])$/i.test(m.productCode) && m.id !== "SS02" && m.id !== "SS03") {
          continue;
        }
        merged.set(m.id, { ...merged.get(m.id), ...m });
      }
      setModules(listMotivationModules([...merged.values()]));
    });
  }, []);

  return (
    <section className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)]">
      <h3 className="font-display text-xl font-bold text-cg-text">Motivation modules (M1–M12)</h3>
      <p className="mt-1 text-sm text-cg-muted">
        Game-based MBS assessments — Likert questionnaires and workplace scenario modules.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const playable = hasModuleConfig(mod.productCode) || hasModuleConfig(mod.id);
          const href = `/assessments/${mod.productCode}`;
          return (
            <article
              key={mod.id}
              className="flex flex-col rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-4 shadow-[2px_2px_0_0_var(--cg-3d-border)] dark:bg-slate-900/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                  {mod.productCode}
                </span>
                <span className="text-[10px] font-semibold uppercase text-cg-muted">{mod.status}</span>
              </div>
              <p className="mt-2 font-display text-base font-bold text-cg-text">{mod.title}</p>
              <p className="mt-1 text-xs text-cg-muted">
                {mod.engineType.replace("_", " ")} · ~{mod.estimatedMinutes} min
              </p>
              <div className="mt-auto pt-3">
                {playable ? (
                  <Link
                    href={href}
                    className="inline-block w-full rounded-lg border border-[var(--cg-3d-border)] bg-emerald-800 px-2.5 py-2 text-center text-xs font-semibold text-white"
                  >
                    Start module
                  </Link>
                ) : (
                  <span className="inline-block w-full rounded-lg border border-dashed border-[var(--cg-3d-border)] px-2.5 py-2 text-center text-xs font-semibold text-cg-muted">
                    Config coming soon
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
