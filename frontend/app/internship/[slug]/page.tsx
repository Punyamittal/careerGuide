"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getInternshipOrNull } from "@/lib/virtual-internships";

const backClass =
  "inline-flex items-center gap-2 rounded-xl border-2 border-emerald-950 bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-[4px_4px_0_0_var(--cg-3d-border)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-emerald-600";

const cardClass =
  "rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]";

export default function VirtualInternshipPage() {
  const params = useParams();
  const router = useRouter();
  const raw = params.slug as string;
  const slug = useMemo(() => decodeURIComponent(raw), [raw]);

  const sim = useMemo(() => getInternshipOrNull(slug), [slug]);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});

  if (!sim) {
    return (
      <div className="min-h-screen bg-cg-canvas p-6">
        <div className="mx-auto max-w-lg space-y-4">
          <p className="text-lg font-semibold text-cg-text">No simulation for this role yet.</p>
          <p className="text-sm text-cg-muted">
            Try opening a simulation from your dashboard career matches, or browse all roles.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className={backClass}>
              ← Dashboard
            </Link>
            <Link
              href="/internship"
              className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-4 py-2.5 text-sm font-bold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]"
            >
              Browse simulations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 1 + sim.scenes.length;
  const isIntro = step === 0;
  const isDone = step > sim.scenes.length;
  const scene = !isIntro && !isDone ? sim.scenes[step - 1] : null;

  function pickChoice(sceneId: string, choiceId: string) {
    setPicked((p) => ({ ...p, [sceneId]: choiceId }));
  }

  const main = (
    <div className="mx-auto max-w-2xl space-y-6 pb-16 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => router.back()} className={backClass}>
          ← Back
        </button>
        <Link
          href="/internship"
          className="text-sm font-semibold text-emerald-800 underline decoration-emerald-800/40 underline-offset-4 hover:text-emerald-950"
        >
          All roles
        </Link>
      </div>

      <header className="space-y-2 border-b-2 border-[var(--cg-3d-border)] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
          Virtual internship
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-cg-text">{sim.roleTitle}</h1>
        <p className="text-base font-medium text-cg-muted">{sim.tagline}</p>
        <p className="text-xs font-medium text-cg-muted">
          Step {Math.min(step + 1, totalSteps + 1)} of {totalSteps + 1} · exploratory only, not graded
        </p>
      </header>

      {isIntro ? (
        <section className={cardClass}>
          <h2 className="font-display text-lg font-bold text-cg-text">Before you start</h2>
          <p className="mt-4 text-sm font-medium leading-relaxed text-cg-text">{sim.intro}</p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-6 w-full rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-700 py-3 text-sm font-bold text-white shadow-[4px_4px_0_0_var(--cg-3d-border)] transition hover:bg-emerald-600"
          >
            Begin simulation
          </button>
        </section>
      ) : null}

      {scene ? (
        <section className={cardClass}>
          <h2 className="font-display text-lg font-bold text-cg-text">{scene.title}</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-cg-text">{scene.situation}</p>
          <div className="mt-5 space-y-3">
            {scene.choices.map((c) => {
              const active = picked[scene.id] === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickChoice(scene.id, c.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left text-sm font-medium transition ${
                    active
                      ? "border-emerald-800 bg-emerald-50 text-emerald-950 shadow-[3px_3px_0_0_var(--cg-3d-border)] dark:bg-emerald-950/40 dark:text-emerald-100"
                      : "border-[var(--cg-3d-border)] bg-white hover:border-emerald-700/50 dark:bg-zinc-900/40"
                  }`}
                >
                  <span className="font-semibold text-cg-text">{c.label}</span>
                  {active ? (
                    <p className="mt-2 border-l-2 border-emerald-600 pl-3 text-xs text-cg-muted">{c.reflection}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-4 py-2 text-sm font-semibold text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!picked[scene.id]}
              className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0_0_var(--cg-3d-border)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {step >= sim.scenes.length ? "Finish" : "Next"}
            </button>
          </div>
        </section>
      ) : null}

      {isDone ? (
        <section className={cardClass}>
          <h2 className="font-display text-lg font-bold text-cg-text">{sim.wrapUp.title}</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm font-medium text-cg-text">
            {sim.wrapUp.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="mt-6 text-xs font-medium text-cg-muted">
            This simulation is educational fiction — use it to reflect, not to predict job offers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className={backClass}>
              ← Dashboard
            </Link>
            <Link
              href="/internship"
              className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-4 py-2.5 text-sm font-bold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]"
            >
              Another role
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );

  return <div className="min-h-screen bg-cg-canvas px-4">{main}</div>;
}
