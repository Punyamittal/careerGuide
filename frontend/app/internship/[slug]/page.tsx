"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getInternshipOrNull } from "@/lib/virtual-internships";

const backClass =
  "inline-flex items-center gap-2 rounded-xl border-2 border-emerald-950 bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-[4px_4px_0_0_var(--cg-3d-border)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-emerald-600";

const cardClass =
  "rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]";

function useTypewriter(text: string, speed = 20) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);
    return () => window.clearInterval(timer);
  }, [text, speed]);

  return displayed;
}

type StoryTone = "confident" | "balanced" | "cautious";

function inferTone(picked: Record<string, string>) {
  const values = Object.values(picked);
  const aCount = values.filter((value) => value === "a").length;
  const cCount = values.filter((value) => value === "c").length;
  if (aCount >= 2) return "confident" as StoryTone;
  if (cCount >= 2) return "cautious" as StoryTone;
  return "balanced" as StoryTone;
}

function getStoryBeat(tone: StoryTone) {
  if (tone === "confident") return "You are leading with clarity and calm execution.";
  if (tone === "cautious") return "You are moving carefully and asking strong risk questions.";
  return "You are balancing action with thoughtful trade-offs.";
}

function sceneImage(roleTitle: string, sceneTitle: string, idx: number) {
  const q = encodeURIComponent(`${roleTitle} ${sceneTitle} cinematic illustration`);
  return `https://picsum.photos/seed/${q}-${idx}/1200/640`;
}

export default function VirtualInternshipPage() {
  const params = useParams();
  const router = useRouter();
  const raw = params.slug as string;
  const slug = useMemo(() => decodeURIComponent(raw), [raw]);

  const sim = useMemo(() => getInternshipOrNull(slug), [slug]);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [lastReflection, setLastReflection] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [aiNarration, setAiNarration] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

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
  const tone = inferTone(picked);
  const pickedCount = Object.keys(picked).length;

  function pickChoice(sceneId: string, choiceId: string) {
    const choice = sim.scenes.find((s) => s.id === sceneId)?.choices.find((c) => c.id === choiceId);
    setPicked((p) => ({ ...p, [sceneId]: choiceId }));
    setLastReflection(choice?.reflection ?? null);
    setShowPopup(true);
  }

  const narratorText = useMemo(() => {
    if (aiNarration?.trim()) return aiNarration;
    if (isIntro) {
      return `${sim.intro}\n\nGrok Dynamic Story Engine: ON. Your choices will shape the tone, pacing, and events in this role-play.`;
    }
    if (scene) {
      return `${getStoryBeat(tone)}\n\nScene ${step} / ${sim.scenes.length}: ${scene.situation}`;
    }
    const outcome = pickedCount >= 2 ? "strong role alignment" : "early-stage exploration";
    return `Simulation complete. Your decision style indicates ${outcome}. ${getStoryBeat(tone)} Continue exploring to evolve this story arc.`;
  }, [aiNarration, isIntro, pickedCount, scene, sim.intro, sim.scenes.length, step, tone]);
  const typedNarrator = useTypewriter(narratorText, 18);

  useEffect(() => {
    if (!speakerOn) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!narratorText.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narratorText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [narratorText, speakerOn]);

  useEffect(() => {
    const context = {
      role: sim.roleTitle,
      tagline: sim.tagline,
      scene: scene?.title ?? "Introduction",
      tone,
      picked,
      pickedCount,
      instruction:
        "Write 3-5 short cinematic lines in second person for a day-in-the-life simulation. Keep it encouraging and specific to the selected scene."
    };
    const message = scene
      ? `Continue the ${sim.roleTitle} simulation for scene "${scene.title}" with dynamic consequences from previous choices.`
      : `Start a cinematic day-in-the-life intro for the ${sim.roleTitle} simulation.`;

    let cancelled = false;
    setAiLoading(true);
    setAiNarration(null);
    api<{ reply?: string; provider?: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, context })
    })
      .then((res) => {
        if (cancelled) return;
        setAiNarration(res.data?.reply ?? null);
        setAiProvider(res.data?.provider ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setAiNarration(null);
        setAiProvider(null);
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [picked, pickedCount, scene, sim.roleTitle, sim.tagline, tone]);

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
          Career match simulation
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-cg-text">{sim.roleTitle}</h1>
        <p className="text-base font-medium text-cg-muted">{sim.tagline}</p>
        <p className="text-xs font-medium text-cg-muted">
          Step {Math.min(step + 1, totalSteps + 1)} of {totalSteps + 1} · exploratory only, not graded
        </p>
      </header>

      <section className={`${cardClass} overflow-hidden p-0`}>
        <img src={sceneImage(sim.roleTitle, scene?.title ?? "intro", step)} alt={`${sim.roleTitle} simulation scene`} className="h-52 w-full object-cover sm:h-64" />
        <div className="p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300">
              Dynamic narrator
            </p>
            <button
              type="button"
              onClick={() => setSpeakerOn((v) => !v)}
              className="rounded-md border-2 border-[var(--cg-3d-border)] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)]"
            >
              {speakerOn ? "Speaker on" : "Speaker off"}
            </button>
          </div>
          <p className="mb-2 text-[11px] font-semibold text-cg-muted">
            Engine: {aiProvider ?? "grok-style fallback"} {aiLoading ? "· generating..." : ""}
          </p>
          <div className="min-h-20 rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-3 text-sm font-medium leading-relaxed text-cg-text">
            {typedNarrator}
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-emerald-800 align-middle" />
          </div>
        </div>
      </section>

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
        <section className={`${cardClass} animate-[fadeSlide_260ms_ease-out]`}>
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

      {showPopup ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-[var(--cg-3d-border)] bg-white p-5 shadow-[var(--cg-3d-shadow)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800">Story update</p>
            <p className="mt-2 text-sm font-semibold text-cg-text">{getStoryBeat(tone)}</p>
            <p className="mt-2 text-sm text-cg-muted">{lastReflection ?? "Your choice changes the next scene context."}</p>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-4 w-full rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0_0_var(--cg-3d-border)]"
            >
              Continue story
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return <div className="min-h-screen bg-cg-canvas px-4">{main}</div>;
}
