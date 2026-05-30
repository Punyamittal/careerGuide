"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import type { SimulationDialogueMessage, SimulationSpeaker } from "@/lib/simulation-dialogue";

const TAG_LABELS = ["Career paths", "Skill progress", "Simulations", "Tasks", "Analytics"] as const;

const EXAMPLE_MENTOR_LINE =
  "Every career path looks confusing in the beginning, beta. Let's break this problem into smaller steps together.";

const GAP_MAIN = "gap-3 sm:gap-4";

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0h-2a7 7 0 006 6.92V20H8v2h8v-2h-3v-2.08A7 7 0 0020 11h-2z" />
    </svg>
  );
}

function TypingDots({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`.trim()} aria-label="Typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 motion-safe:animate-typing-dot motion-reduce:animate-none dark:bg-zinc-500"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

function ChatBubble({
  message,
  index,
  side
}: {
  message: SimulationDialogueMessage;
  index: number;
  side: "left" | "right";
}) {
  const isRaghav = message.speaker === "raghav";
  const delayMs = index * 85;

  return (
    <div
      className={`flex w-full ${side === "left" ? "justify-start" : "justify-end"} motion-safe:opacity-0 motion-safe:[animation:fadeSlide_420ms_ease-out_forwards] motion-reduce:opacity-100`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className={`relative max-w-[min(100%,420px)] ${side === "left" ? "pr-2" : "pl-2"}`}>
        {side === "left" ? (
          <div
            className="absolute -left-1 bottom-3 z-0 h-2.5 w-2.5 rotate-45 border-b border-l border-black/[0.08] bg-emerald-50/95 dark:border-white/[0.1] dark:bg-emerald-950/50"
            aria-hidden
          />
        ) : (
          <div
            className="absolute -right-1 bottom-3 z-0 h-2.5 w-2.5 rotate-45 border-r border-t border-black/[0.08] bg-violet-50/95 dark:border-white/[0.1] dark:bg-violet-950/40"
            aria-hidden
          />
        )}
        <div
          className={`relative z-[1] rounded-[16px] border border-black/[0.08] px-3.5 py-2.5 text-sm font-normal leading-relaxed shadow-[0_2px_14px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_18px_-4px_rgba(0,0,0,0.35)] ${
            isRaghav
              ? "rounded-bl-md bg-emerald-50/95 text-zinc-800 dark:bg-emerald-950/45 dark:text-zinc-100"
              : "rounded-br-md bg-violet-50/95 text-zinc-800 dark:bg-violet-950/35 dark:text-zinc-100"
          }`}
        >
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {isRaghav ? "Raghav" : "Dolly"}
          </span>
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    </div>
  );
}

function CharacterAvatar({
  speaker,
  active,
  label,
  sub,
  imageSrc,
  imageAlt,
  className
}: {
  speaker: SimulationSpeaker;
  active: boolean;
  label: string;
  sub: string;
  imageSrc: string;
  imageAlt: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center text-center ${className ?? ""} transition-transform duration-300 ${
        active ? "motion-safe:scale-[1.04] motion-reduce:scale-100" : "scale-100"
      }`}
    >
      <div
        className={`relative h-[120px] w-[100px] sm:h-[140px] sm:w-[118px] md:h-[160px] md:w-[130px] ${
          active
            ? "motion-safe:drop-shadow-[0_0_20px_rgba(16,185,129,0.35)] motion-reduce:drop-shadow-none"
            : "opacity-95"
        }`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority={speaker === "raghav"}
          className="object-contain object-bottom motion-safe:animate-mentor-breathe motion-reduce:animate-none"
          sizes="130px"
        />
      </div>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
        {label}
      </p>
      <p className="max-w-[140px] text-[10px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">{sub}</p>
    </div>
  );
}

export type MentorStageProps = {
  roleTitle: string;
  /** Alternating lines for the chat UI (additive dual-character mode). */
  dialogue: SimulationDialogueMessage[];
  aiLoading: boolean;
  aiProvider: string | null;
  speakerOn: boolean;
  onSpeakerToggle: () => void;
  isIntro: boolean;
};

export function MentorStage({
  roleTitle,
  dialogue,
  aiLoading,
  aiProvider,
  speakerOn,
  onSpeakerToggle,
  isIntro
}: MentorStageProps) {
  const chatId = useId();
  const activeSpeaker: SimulationSpeaker | null = useMemo(() => {
    if (aiLoading) return null;
    const last = dialogue[dialogue.length - 1];
    return last ? last.speaker : null;
  }, [aiLoading, dialogue]);

  const [autoPlay, setAutoPlay] = useState(false);
  const [playIdx, setPlayIdx] = useState(0);

  useEffect(() => {
    if (!autoPlay || dialogue.length <= 1) return;
    const t = window.setInterval(() => {
      setPlayIdx((i) => (i + 1) % dialogue.length);
    }, 2800);
    return () => window.clearInterval(t);
  }, [autoPlay, dialogue.length]);

  const highlightSpeaker = autoPlay && dialogue.length ? dialogue[playIdx]?.speaker ?? null : activeSpeaker;

  return (
    <section
      className={`overflow-visible rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_28px_-6px_rgba(0,0,0,0.1),0_2px_10px_-4px_rgba(0,0,0,0.06)] motion-safe:[animation:fadeSlide_420ms_ease-out] dark:border-white/[0.1] dark:bg-zinc-900 dark:shadow-[0_4px_32px_-6px_rgba(0,0,0,0.45),0_2px_12px_-4px_rgba(0,0,0,0.35)]`}
    >
      <div
        className={`flex flex-wrap items-center ${GAP_MAIN} border-b border-black/[0.06] bg-emerald-50/90 px-4 py-2.5 dark:border-white/[0.08] dark:bg-emerald-950/40 sm:px-5`}
      >
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
        {/* Mobile: both avatars above chat */}
        <div className="mb-4 flex justify-center gap-10 sm:gap-14 lg:hidden">
          <CharacterAvatar
            speaker="raghav"
            active={highlightSpeaker === "raghav"}
            label="Raghav"
            sub="Mentor"
            imageSrc="/raghav.png"
            imageAlt="Raghav, mentor"
          />
          <CharacterAvatar
            speaker="dolly"
            active={highlightSpeaker === "dolly"}
            label="Dolly"
            sub="Peer"
            imageSrc="/dolly.png"
            imageAlt="Dolly, peer"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(100px,140px)_1fr_minmax(100px,140px)] lg:items-end lg:gap-3">
          <div className="hidden justify-center lg:flex">
            <CharacterAvatar
              speaker="raghav"
              active={highlightSpeaker === "raghav"}
              label="Raghav"
              sub="Mentor"
              imageSrc="/raghav.png"
              imageAlt="Raghav, mentor"
            />
          </div>

          <div
            className="flex min-h-[min(52vh,440px)] flex-col rounded-2xl border border-black/[0.06] bg-zinc-50/80 dark:border-white/[0.08] dark:bg-zinc-950/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.08] sm:px-4">
              <div className="min-w-0 space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                  Conversation
                </p>
                <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50 sm:text-base">
                  {roleTitle}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={autoPlay}
                    onChange={(e) => {
                      setAutoPlay(e.target.checked);
                      setPlayIdx(0);
                    }}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Auto highlights
                </label>
                <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 shadow-sm dark:bg-zinc-900/90">
                  <MicIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  {aiLoading ? <TypingDots /> : null}
                </div>
                <button
                  type="button"
                  onClick={onSpeakerToggle}
                  className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                >
                  {speakerOn ? "Speaker on" : "Speaker off"}
                </button>
              </div>
            </div>

            <div
              id={chatId}
              className="max-h-[min(52vh,480px)] flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              {isIntro && aiLoading ? (
                <p className="px-1 text-xs font-medium italic text-zinc-500 dark:text-zinc-400">
                  “{EXAMPLE_MENTOR_LINE}”
                </p>
              ) : null}

              {dialogue.map((msg, i) => (
                <ChatBubble key={`${msg.speaker}-${i}-${msg.text.slice(0, 24)}`} message={msg} index={i} side={msg.speaker === "raghav" ? "left" : "right"} />
              ))}

              {aiLoading ? (
                <div className="flex justify-center py-2">
                  <div className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/90 px-4 py-2 text-xs font-medium text-zinc-500 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-400">
                    <TypingDots />
                    Raghav &amp; Dolly are thinking…
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-black/[0.06] px-4 py-2.5 dark:border-white/[0.08] sm:px-4">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {aiLoading ? "Personalizing…" : `Voice · ${aiProvider ?? "fallback"}`}
              </p>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <CharacterAvatar
              speaker="dolly"
              active={highlightSpeaker === "dolly"}
              label="Dolly"
              sub="Peer"
              imageSrc="/dolly.png"
              imageAlt="Dolly, peer"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
