"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import type { NarrativeDecisionOption, NarrativeSpeaker, NarrativeStep } from "@/lib/simulation-narrative-parser";
import { speakNarrativeLine } from "@/lib/narrative-speech";
import { cn } from "@/lib/utils";

const TAG_LABELS = ["Career paths", "Skill progress", "Simulations", "Tasks", "Analytics"] as const;

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0h-2a7 7 0 006 6.92V20H8v2h8v-2h-3v-2.08A7 7 0 0020 11h-2z" />
    </svg>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1" aria-label="Typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 motion-safe:animate-typing-dot motion-reduce:animate-none"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

/** Tail pointing toward the character (bubble on opposite side of tail). */
function BubbleTail({ toward }: { toward: "left" | "right" }) {
  if (toward === "left") {
    return (
      <span
        className="pointer-events-none absolute top-[34%] z-10 -mt-2 -translate-y-1/2 border-y-[10px] border-r-[13px] border-y-transparent border-r-white drop-shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:border-r-zinc-900"
        style={{ left: -12 }}
        aria-hidden
      />
    );
  }
  return (
    <span
      className="pointer-events-none absolute top-[34%] z-10 -mt-2 -translate-y-1/2 border-y-[10px] border-l-[13px] border-y-transparent border-l-white drop-shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:border-l-zinc-900"
      style={{ right: -12 }}
      aria-hidden
    />
  );
}

export type NarrativePhase = "dialogue" | "decision" | "done";

export type NarrativeAdvanceKind = "next-line" | "to-decision" | "finish-intro";

export type NarrativeScenePlayerProps = {
  /** Bumps inner state when the simulation scene / intro segment changes. */
  sceneKey: string;
  roleTitle: string;
  sceneLabel: string;
  contextLine: string;
  displayLine: NarrativeStep | null;
  /** Bumps when a new line arrives (drives text animation; same speaker = text-only swap). */
  utteranceEpoch: number;
  narrativePhase: NarrativePhase;
  decision: { question: string; options: NarrativeDecisionOption[] } | null;
  aiLoading: boolean;
  aiProvider: string | null;
  speakerOn: boolean;
  onSpeakerToggle: () => void;
  dialogueLineCount: number;
  dialogueCap: number;
  /** What the next tap does at the end of the scripted dialogue (batch narrative). */
  advanceKind?: NarrativeAdvanceKind | null;
  canAdvance: boolean;
  onAdvance: () => void;
  onDecisionPick?: (optionIndex: number) => void;
  decisionPickedIndex?: number | null;
  /** Shown when intro dialogue is finished — primary CTA inside the simulation card. */
  showBeginSimulationCta?: boolean;
  onBeginSimulation?: () => void;
};

type CharMotion = "enter" | "exit" | "idle";

function SideDialogueBeat({
  displayLine,
  utteranceEpoch,
  decision,
  atDecision,
  introExhausted,
  canAdvance,
  advanceKind,
  onDecisionPick,
  decisionPickedIndex,
  speakerOn,
  aiLoading,
  showBeginSimulationCta,
  onBeginSimulation
}: {
  displayLine: NarrativeStep | null;
  utteranceEpoch: number;
  decision: { question: string; options: NarrativeDecisionOption[] } | null;
  atDecision: boolean;
  introExhausted: boolean;
  canAdvance: boolean;
  advanceKind: NarrativeAdvanceKind | null;
  onDecisionPick?: (optionIndex: number) => void;
  decisionPickedIndex?: number | null;
  speakerOn: boolean;
  aiLoading: boolean;
  showBeginSimulationCta?: boolean;
  onBeginSimulation?: () => void;
}) {
  const targetSpeaker: NarrativeSpeaker = displayLine?.speaker ?? "raghav";
  const [renderedSpeaker, setRenderedSpeaker] = useState<NarrativeSpeaker>(targetSpeaker);
  const [charMotion, setCharMotion] = useState<CharMotion>("enter");

  useEffect(() => {
    const t = window.setTimeout(() => setCharMotion("idle"), 560);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!displayLine) return;
    const next = displayLine.speaker;
    if (next === renderedSpeaker) return;

    let idleAfterEnter: ReturnType<typeof setTimeout> | undefined;
    let swap: ReturnType<typeof setTimeout> | undefined;
    queueMicrotask(() => {
      setCharMotion("exit");
      swap = window.setTimeout(() => {
        setRenderedSpeaker(next);
        setCharMotion("enter");
        idleAfterEnter = window.setTimeout(() => setCharMotion("idle"), 560);
      }, 480);
    });

    return () => {
      if (swap) clearTimeout(swap);
      if (idleAfterEnter) clearTimeout(idleAfterEnter);
    };
  }, [displayLine, displayLine?.speaker, renderedSpeaker]);

  const side = renderedSpeaker === "raghav" ? "left" : "right";

  const charAnim =
    charMotion === "exit"
      ? side === "left"
        ? "motion-safe:animate-narrative-fly-out-left motion-reduce:opacity-100 motion-reduce:translate-x-0"
        : "motion-safe:animate-narrative-fly-out-right motion-reduce:opacity-100 motion-reduce:translate-x-0"
      : charMotion === "enter"
        ? side === "left"
          ? "motion-safe:animate-narrative-fly-in-left motion-reduce:opacity-100 motion-reduce:translate-x-0"
          : "motion-safe:animate-narrative-fly-in-right motion-reduce:opacity-100 motion-reduce:translate-x-0"
        : "";

  const showVoicePulse = speakerOn && !aiLoading && !!displayLine?.text;

  return (
    <div className="relative mx-auto w-full max-w-[520px] md:max-w-none">
      {/* Mobile: bubble above character; desktop: horizontal dialogue band */}
      <div
        className={cn(
          "relative flex min-h-[300px] flex-col gap-3 pb-2 sm:min-h-[320px] md:min-h-[420px] md:flex-row md:items-end md:justify-center md:gap-0 md:pb-8",
          side === "right" && "md:flex-row-reverse"
        )}
      >
        {/* Character — inset on mobile, edge on desktop; shifted down vs bubble */}
        <div
          className={cn(
            "pointer-events-none relative z-10 flex shrink-0 justify-center md:absolute md:bottom-0 md:w-[min(42vw,340px)] max-md:translate-y-10 md:translate-y-16",
            side === "left"
              ? "md:-left-1 md:justify-start md:-translate-x-2"
              : "md:-right-1 md:justify-end md:translate-x-2",
            "max-md:order-2 max-md:px-3"
          )}
        >
          <div
            className={cn(
              "relative h-[200px] w-[200px] max-md:scale-[1.05] sm:h-[240px] sm:w-[240px] md:h-[min(52vh,400px)] md:w-[min(48vw,340px)] md:max-w-[340px]",
              charAnim,
              charMotion === "idle" && "motion-safe:animate-mentor-breathe motion-reduce:animate-none"
            )}
          >
            <Image
              src={renderedSpeaker === "raghav" ? "/raghav.png" : "/dolly.png"}
              alt={renderedSpeaker === "raghav" ? "Raghav" : "Dolly"}
              fill
              className="object-contain object-bottom"
              sizes="(max-width: 768px) 240px, 340px"
              priority
            />
          </div>
        </div>

        {/* Speech bubble + decision */}
        <div
          className={cn(
            "relative z-20 flex w-full flex-1 flex-col justify-end px-1 max-md:-mt-4 max-md:order-1",
            "md:absolute md:bottom-[10rem] md:max-w-[min(100%,480px)]",
            side === "left" ? "md:left-[clamp(180px,30vw,300px)] md:pl-2" : "md:right-[clamp(180px,30vw,300px)] md:pr-2"
          )}
        >
          {!atDecision && displayLine ? (
            <div
              className={cn(
                "relative rounded-[18px] border border-black/[0.1] bg-white px-5 py-4 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.18)] dark:border-white/[0.12] dark:bg-zinc-900",
                showVoicePulse &&
                  "motion-safe:animate-narrative-voice-pulse motion-reduce:animate-none dark:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)]"
              )}
            >
              <BubbleTail toward={side === "left" ? "left" : "right"} />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-400">
                {displayLine.speaker === "raghav" ? "Raghav · mentor" : "Dolly · peer"}
              </p>
              <p
                key={utteranceEpoch}
                className="mt-2 text-left text-sm font-semibold leading-relaxed text-zinc-900 motion-safe:animate-narrative-text motion-reduce:animate-none dark:text-zinc-50"
              >
                {displayLine.text}
              </p>
            </div>
          ) : null}

          {atDecision && decision ? (
            <div
              className={cn(
                "relative rounded-[18px] border border-black/[0.1] bg-white px-5 py-4 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.18)] dark:border-white/[0.12] dark:bg-zinc-900"
              )}
            >
              <BubbleTail toward={side === "left" ? "left" : "right"} />
              <p className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{decision.question}</p>
              <div className="mt-3 grid gap-2">
                {decision.options.map((opt, idx) => (
                  <button
                    key={opt.letter}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDecisionPick?.(idx);
                    }}
                    className={cn(
                      "rounded-xl border border-black/[0.08] bg-zinc-50/90 px-4 py-3 text-left text-sm font-medium text-zinc-900 shadow-sm transition-all duration-200 hover:border-emerald-600/40 hover:bg-emerald-50/80 active:scale-[0.98] dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-emerald-950/40",
                      decisionPickedIndex === idx &&
                        "scale-[1.01] border-emerald-600/50 bg-emerald-50/90 ring-2 ring-emerald-500/55 motion-safe:animate-narrative-option-pick dark:bg-emerald-950/35"
                    )}
                  >
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{opt.letter}.</span> {opt.text}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {introExhausted ? (
            <div className="mt-3 space-y-3">
              <p className="text-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:text-left">
                That’s the intro beat. Start the first scene when you’re ready.
              </p>
              {showBeginSimulationCta && onBeginSimulation ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBeginSimulation();
                  }}
                  className="w-full rounded-xl border-2 border-emerald-800 bg-emerald-700 py-3 text-sm font-bold text-white shadow-[3px_3px_0_0_rgba(6,78,59,0.35)] transition hover:bg-emerald-600 active:translate-y-px active:shadow-none dark:border-emerald-600 dark:shadow-[3px_3px_0_0_rgba(6,95,70,0.5)]"
                >
                  Begin simulation
                </button>
              ) : null}
            </div>
          ) : null}

          {!atDecision && !introExhausted && !aiLoading ? (
            <p className="mt-3 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500 md:text-left">
              {canAdvance
                ? advanceKind === "to-decision"
                  ? "Tap scene to reveal your options"
                  : advanceKind === "finish-intro"
                    ? "Tap when you’re ready for the recap"
                    : "Tap scene for the next line"
                : ""}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function NarrativeScenePlayer({
  sceneKey,
  roleTitle,
  sceneLabel,
  contextLine,
  displayLine,
  utteranceEpoch,
  narrativePhase,
  decision,
  aiLoading,
  aiProvider,
  speakerOn,
  onSpeakerToggle,
  dialogueLineCount,
  dialogueCap,
  advanceKind = null,
  canAdvance,
  onAdvance,
  onDecisionPick,
  decisionPickedIndex,
  showBeginSimulationCta = false,
  onBeginSimulation
}: NarrativeScenePlayerProps) {
  const panelId = useId();
  const atDecision = narrativePhase === "decision" && decision && decision.options.length > 0;
  const introExhausted = narrativePhase === "done";

  useEffect(() => {
    if (!speakerOn || !displayLine?.text) return;
    return speakNarrativeLine(displayLine.text, displayLine.speaker);
  }, [displayLine?.text, displayLine?.speaker, speakerOn, utteranceEpoch]);

  const progressLabel = useMemo(() => {
    if (atDecision) return "Decision";
    if (introExhausted) return "Ready to continue";
    return `Line ${Math.min(dialogueLineCount, dialogueCap)} / ${dialogueCap}`;
  }, [atDecision, dialogueCap, dialogueLineCount, introExhausted]);

  const tapActive = canAdvance && !atDecision && !introExhausted && !aiLoading;

  return (
    <section className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_28px_-6px_rgba(0,0,0,0.1)] motion-safe:[animation:fadeSlide_420ms_ease-out] dark:border-white/[0.1] dark:bg-zinc-900 dark:shadow-[0_4px_32px_-6px_rgba(0,0,0,0.45)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] bg-emerald-50/90 px-4 py-2.5 dark:border-white/[0.08] dark:bg-emerald-950/40 sm:gap-4 sm:px-5">
        {TAG_LABELS.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-200"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden />
            {label}
          </span>
        ))}
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
              {sceneLabel}
            </p>
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50 sm:text-lg">{roleTitle}</h2>
            <p className="mt-1 line-clamp-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">{contextLine}</p>
          </div>
          <div className="relative z-30 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
              <MicIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              {aiLoading ? <TypingDots /> : null}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSpeakerToggle();
              }}
              className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {speakerOn ? "Speaker on" : "Speaker off"}
            </button>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          id={panelId}
          onClick={() => {
            if (tapActive) onAdvance();
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && tapActive) {
              e.preventDefault();
              onAdvance();
            }
          }}
          className={cn(
            "relative overflow-x-clip overflow-y-visible rounded-2xl border border-black/[0.06] outline-none dark:border-white/[0.08]",
            tapActive ? "cursor-pointer hover:brightness-[1.02] dark:hover:brightness-110" : "cursor-default",
            atDecision || introExhausted || aiLoading ? "cursor-default" : null
          )}
          aria-label={
            atDecision ? "Decision" : introExhausted ? "Intro complete" : tapActive ? "Tap for next line" : "Story beat"
          }
        >
          <span
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/corperate.png')" }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/62 via-white/52 to-white/65 dark:from-zinc-950/58 dark:via-zinc-950/48 dark:to-zinc-950/62"
            aria-hidden
          />
          <p className="pointer-events-none absolute left-3 top-3 z-30 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 drop-shadow-sm dark:text-zinc-300">
            {progressLabel}
          </p>

          {aiLoading && !displayLine ? (
            <div className="relative z-10 flex flex-col items-center justify-center gap-3 py-16">
              <TypingDots />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Loading scene…</p>
            </div>
          ) : (
            <div className="relative z-10 px-2 pb-3 pt-10 sm:px-4">
              <SideDialogueBeat
                key={sceneKey}
                displayLine={displayLine}
                utteranceEpoch={utteranceEpoch}
                decision={decision}
                atDecision={atDecision}
                introExhausted={introExhausted}
                canAdvance={canAdvance}
                advanceKind={advanceKind}
                onDecisionPick={onDecisionPick}
                decisionPickedIndex={decisionPickedIndex}
                speakerOn={speakerOn}
                aiLoading={aiLoading}
                showBeginSimulationCta={showBeginSimulationCta}
                onBeginSimulation={onBeginSimulation}
              />
            </div>
          )}
        </div>

        <p className="mt-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {aiLoading
            ? "Waiting for model…"
            : `Voice · ${aiProvider ?? "fallback"} · full sequence loaded, one line per tap`}
        </p>
      </div>
    </section>
  );
}
