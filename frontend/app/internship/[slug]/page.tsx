"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NarrativeScenePlayer, type NarrativePhase } from "@/components/simulation/narrative-scene-player";
import { api } from "@/lib/api";
import {
  SIMULATION_BATCH_JSON_PROMPT,
  buildFallbackBatchNarrative,
  parseBatchNarrativeJson,
  type NarrativeStep
} from "@/lib/simulation-narrative-parser";
import { getInternshipOrNull } from "@/lib/virtual-internships";

const backClass =
  "inline-flex items-center gap-2 rounded-xl border-2 border-emerald-950 bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-[4px_4px_0_0_var(--cg-3d-border)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-emerald-600";

const cardClass =
  "rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]";

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
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [startedAt] = useState<number>(() => Date.now());
  const [narrativePickIdx, setNarrativePickIdx] = useState<number | null>(null);
  const [narrativeSteps, setNarrativeSteps] = useState<NarrativeStep[]>([]);
  const narrativeStepsRef = useRef<NarrativeStep[]>([]);
  const [narrativeStepIndex, setNarrativeStepIndex] = useState(0);
  const narrativeStepIndexRef = useRef(0);
  const [displayLine, setDisplayLine] = useState<NarrativeStep | null>(null);
  const [utteranceEpoch, setUtteranceEpoch] = useState(0);
  const [narrativePhase, setNarrativePhase] = useState<NarrativePhase>("dialogue");
  const [decisionPayload, setDecisionPayload] = useState<{
    question: string;
    options: { letter: string; text: string }[];
  } | null>(null);
  const fetchGen = useRef(0);
  const pickedRef = useRef(picked);
  pickedRef.current = picked;

  const totalSteps = sim ? 1 + sim.scenes.length : 0;
  const isIntro = sim ? step === 0 : false;
  const isDone = sim ? step > sim.scenes.length : false;
  const scene =
    sim && !isIntro && !isDone ? sim.scenes[step - 1] ?? null : null;
  const tone = inferTone(picked);
  const pickedCount = Object.keys(picked).length;

  const pickChoice = useCallback(
    (sceneId: string, choiceId: string) => {
      if (!sim) return;
      const choice = sim.scenes
        .find((s) => s.id === sceneId)
        ?.choices.find((c) => c.id === choiceId);
      setPicked((p) => ({ ...p, [sceneId]: choiceId }));
      setLastReflection(choice?.reflection ?? null);
      setShowPopup(true);
    },
    [sim]
  );

  const dialogueCap = Math.max(narrativeSteps.length, 1);

  const sceneSessionKey = `${step}-${scene?.id ?? "intro"}`;

  useEffect(() => {
    narrativeStepsRef.current = narrativeSteps;
  }, [narrativeSteps]);

  useEffect(() => {
    narrativeStepIndexRef.current = narrativeStepIndex;
  }, [narrativeStepIndex]);

  useEffect(() => {
    if (isDone || !sim) return;

    const req = ++fetchGen.current;
    setNarrativeSteps([]);
    narrativeStepsRef.current = [];
    setNarrativeStepIndex(0);
    narrativeStepIndexRef.current = 0;
    setDisplayLine(null);
    setUtteranceEpoch(0);
    setDecisionPayload(null);
    setNarrativePhase("dialogue");
    queueMicrotask(() => setNarrativePickIdx(null));
    setAiLoading(true);

    const pr = pickedRef.current;
    const context = {
      role: sim.roleTitle,
      tagline: sim.tagline,
      scene: scene?.title ?? "Introduction",
      situation: scene?.situation ?? sim.intro,
      tone: inferTone(pr),
      picked: pr,
      pickedCount: Object.keys(pr).length,
      instruction: SIMULATION_BATCH_JSON_PROMPT,
      intro: sim.intro,
      isIntro
    };
    const message = `Return ONLY valid JSON matching instruction (steps + decision). No markdown. Ground dialogue in context.situation or context.intro. Scene label: "${scene?.title ?? "Introduction"}".`;

    void (async () => {
      try {
        const res = await api<{ reply?: string; provider?: string }>("/ai/chat", {
          method: "POST",
          body: JSON.stringify({ message, context })
        });
        if (req !== fetchGen.current) return;
        setAiProvider(res.data?.provider ?? null);
        const batch =
          parseBatchNarrativeJson(res.data?.reply) ?? buildFallbackBatchNarrative(sim, scene, isIntro);
        narrativeStepsRef.current = batch.steps;
        setNarrativeSteps(batch.steps);
        setDecisionPayload(batch.decision);
        setNarrativeStepIndex(0);
        narrativeStepIndexRef.current = 0;
        setDisplayLine(batch.steps[0] ?? null);
        setUtteranceEpoch((e) => e + 1);
      } catch {
        if (req !== fetchGen.current) return;
        setAiProvider(null);
        const batch = buildFallbackBatchNarrative(sim, scene, isIntro);
        narrativeStepsRef.current = batch.steps;
        setNarrativeSteps(batch.steps);
        setDecisionPayload(batch.decision);
        setNarrativeStepIndex(0);
        narrativeStepIndexRef.current = 0;
        setDisplayLine(batch.steps[0] ?? null);
        setUtteranceEpoch((e) => e + 1);
      } finally {
        if (req === fetchGen.current) setAiLoading(false);
      }
    })();
  }, [isDone, isIntro, scene, sceneSessionKey, sim]);

  const canAdvanceNarrative = useMemo(() => {
    if (isDone || narrativePhase !== "dialogue") return false;
    if (aiLoading || narrativeSteps.length === 0) return false;
    return true;
  }, [aiLoading, isDone, narrativePhase, narrativeSteps.length]);

  const handleNarrativeAdvance = useCallback(() => {
    if (!canAdvanceNarrative || aiLoading) return;
    const steps = narrativeStepsRef.current;
    const idx = narrativeStepIndexRef.current;
    if (steps.length === 0) return;

    if (idx < steps.length - 1) {
      const next = idx + 1;
      narrativeStepIndexRef.current = next;
      setNarrativeStepIndex(next);
      setDisplayLine(steps[next] ?? null);
      setUtteranceEpoch((e) => e + 1);
      return;
    }

    if (isIntro) {
      setNarrativePhase("done");
      return;
    }
    if (scene) {
      setNarrativePhase("decision");
    }
  }, [aiLoading, canAdvanceNarrative, isIntro, scene]);

  const narrativeAdvanceKind = useMemo<"next-line" | "to-decision" | "finish-intro" | null>(() => {
    if (narrativePhase !== "dialogue" || !canAdvanceNarrative || narrativeSteps.length === 0) return null;
    if (narrativeStepIndex < narrativeSteps.length - 1) return "next-line";
    if (isIntro) return "finish-intro";
    return "to-decision";
  }, [canAdvanceNarrative, isIntro, narrativePhase, narrativeStepIndex, narrativeSteps.length]);

  const submitSimulationSession = useCallback(() => {
    if (!sim) return;
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const completionScore = Math.round((pickedCount / Math.max(1, sim.scenes.length)) * 100);
    void api("/simulations/sessions", {
      method: "POST",
      body: JSON.stringify({
        roleSlug: sim.slug,
        roleTitle: sim.roleTitle,
        tone,
        completionScore,
        choices: picked,
        scenesCompleted: pickedCount,
        totalScenes: sim.scenes.length,
        durationSeconds
      })
    }).catch(() => undefined);
  }, [picked, pickedCount, sim, startedAt, tone]);

  const handleReflectionContinue = useCallback(() => {
    setShowPopup(false);
    setStep((s) => {
      if (!sim) return s;
      if (s < 1 || s > sim.scenes.length) return s;
      if (s === sim.scenes.length) {
        queueMicrotask(() => submitSimulationSession());
      }
      return s + 1;
    });
  }, [sim, submitSimulationSession]);

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

  const main = (
    <div className="mx-auto max-w-5xl space-y-5 pb-14 pt-3 sm:space-y-6 sm:pb-16 sm:pt-4">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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

      <header className="space-y-2 border-b-2 border-[var(--cg-3d-border)] pb-5 sm:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
          Career match simulation
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-cg-text">{sim.roleTitle}</h1>
        <p className="text-base font-medium text-cg-muted">{sim.tagline}</p>
        <p className="text-xs font-medium text-cg-muted">
          Step {Math.min(step + 1, totalSteps + 1)} of {totalSteps + 1} · exploratory only, not graded
        </p>
      </header>

      {!isDone ? (
        <NarrativeScenePlayer
          sceneKey={sceneSessionKey}
          roleTitle={sim.roleTitle}
          sceneLabel={scene?.title ?? "Introduction"}
          contextLine={isIntro ? sim.intro : (scene?.situation ?? sim.tagline)}
          displayLine={displayLine}
          utteranceEpoch={utteranceEpoch}
          narrativePhase={narrativePhase}
          decision={decisionPayload}
          aiLoading={aiLoading}
          aiProvider={aiProvider}
          speakerOn={speakerOn}
          onSpeakerToggle={() => setSpeakerOn((v) => !v)}
          dialogueLineCount={narrativeSteps.length ? narrativeStepIndex + 1 : 0}
          dialogueCap={dialogueCap}
          advanceKind={narrativeAdvanceKind}
          canAdvance={canAdvanceNarrative}
          onAdvance={handleNarrativeAdvance}
          decisionPickedIndex={narrativePickIdx}
          showBeginSimulationCta={isIntro && narrativePhase === "done"}
          onBeginSimulation={() => setStep(1)}
          onDecisionPick={(idx) => {
            setNarrativePickIdx(idx);
            if (isIntro || !scene) return;
            const ch = scene.choices[idx];
            if (ch) pickChoice(scene.id, ch.id);
          }}
        />
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
              onClick={handleReflectionContinue}
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
