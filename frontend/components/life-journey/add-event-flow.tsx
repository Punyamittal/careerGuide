"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getFilteredEventOptions } from "@/lib/life-journey/event-engine";
import { useLifeJourneyStore } from "@/lib/life-journey/store";
import {
  EMOTIONS,
  EMOTIONAL_TONES,
  EVENT_DOMAINS,
  EVENT_TYPES,
  IMPACT_DIMENSIONS,
  INTENSITY_LABELS,
  LIFE_STAGES,
  REFLECTION_LENSES,
  SUBCATEGORIES
} from "@/lib/life-journey/taxonomy";
import type { EventDomainId, EmotionalToneId } from "@/lib/life-journey/types";
import { Chip, SelectableCard, StepProgress, cardClass, innerCardClass } from "./ui";

const STEPS = 7;

export function AddEventFlow() {
  const flowOpen = useLifeJourneyStore((s) => s.flowOpen);
  const setFlowOpen = useLifeJourneyStore((s) => s.setFlowOpen);
  const draft = useLifeJourneyStore((s) => s.draft);
  const patchDraft = useLifeJourneyStore((s) => s.patchDraft);
  const setFlowStep = useLifeJourneyStore((s) => s.setFlowStep);
  const resetDraft = useLifeJourneyStore((s) => s.resetDraft);
  const addEventFromDraft = useLifeJourneyStore((s) => s.addEventFromDraft);

  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  const step = draft.flowStep ?? 1;

  useEffect(() => {
    setMounted(true);
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!flowOpen) return;
    setSearch("");
    setCustomOpen(Boolean(draft.customEvent && draft.eventLabel));
    setCustomTitle(draft.customEvent ? (draft.eventLabel ?? "") : "");
    setCustomDescription(draft.customDescription ?? "");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [flowOpen, draft.customEvent, draft.eventLabel, draft.customDescription]);

  const eventOptions = useMemo(
    () =>
      getFilteredEventOptions({
        domain: draft.domain as EventDomainId | undefined,
        subcategory: draft.subcategory,
        eventType: draft.eventType,
        search
      }),
    [draft.domain, draft.subcategory, draft.eventType, search]
  );

  const close = useCallback(() => {
    setFlowOpen(false);
    setSearch("");
    setCustomOpen(false);
  }, [setFlowOpen]);

  const goToStep = useCallback(
    (next: number) => {
      const clamped = Math.min(STEPS, Math.max(1, next));
      setFlowStep(clamped);
      patchDraft({ flowStep: clamped });
    },
    [patchDraft, setFlowStep]
  );

  const next = () => goToStep(step + 1);
  const back = () => goToStep(step - 1);

  const canNext = () => {
    if (step === 1) return Boolean(draft.lifeStage);
    if (step === 2) return Boolean(draft.eventType);
    if (step === 3) return Boolean(draft.domain);
    if (step === 4) return Boolean(draft.subcategory);
    if (step === 5) return Boolean(draft.eventLabel?.trim());
    if (step === 6) return (draft.impacts?.length ?? 0) > 0 && Boolean(draft.intensity);
    if (step === 7) return (draft.emotions?.length ?? 0) > 0 && Boolean(draft.reflectionLens);
    return false;
  };

  const finish = () => {
    const ev = addEventFromDraft();
    if (ev) {
      setSearch("");
      setCustomOpen(false);
    }
  };

  useEffect(() => {
    if (!flowOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
        const active = document.activeElement;
        if (active?.closest("[data-flow-footer]")) return;
        if (canNext() && step < STEPS && !customOpen) {
          e.preventDefault();
          next();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flowOpen, step, draft, customOpen, close, next]);

  const applyCustomEvent = () => {
    const title = customTitle.trim();
    if (!title) return;
    patchDraft({
      eventLabel: title,
      customEvent: true,
      customDescription: customDescription.trim() || undefined,
      emotionalTone: draft.emotionalTone
    });
    setCustomOpen(false);
  };

  if (!flowOpen || !mounted) return null;

  const stepMotion = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : { initial: { opacity: 0, x: 12 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12 } };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
        aria-label="Close add experience dialog"
        onClick={close}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="life-journey-flow-title"
        aria-describedby="life-journey-flow-desc"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className={cnModal()}
      >
        <motion.div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-200/40 to-sky-200/30 blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.4, 0.55, 0.4] }}
          transition={{ duration: 6, repeat: Infinity }}
          aria-hidden
        />

        <motion.header className="relative border-b-2 border-[var(--cg-3d-border)] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                Life Journey · Step {step} of {STEPS}
              </p>
              <h2
                id="life-journey-flow-title"
                className="mt-1 font-display text-xl font-bold text-cg-text"
              >
                {stepTitle(step)}
              </h2>
              <p id="life-journey-flow-desc" className="sr-only">
                Multi-step flow to map a life experience. Use Back and Continue. Draft saves automatically.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  resetDraft();
                  goToStep(1);
                }}
                className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-2 py-1 text-[10px] font-bold text-cg-muted"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-2.5 py-1 text-xs font-bold text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)]"
              >
                Close
              </button>
            </div>
          </div>
          <div className="relative mt-3">
            <StepProgress step={step} total={STEPS} />
          </div>
        </motion.header>

        <div className="relative max-h-[min(62vh,520px)] overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">
            <motion.div key={step} {...stepMotion} transition={{ duration: 0.2 }}>
              {step === 1 && (
                <div
                  className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
                  role="listbox"
                  aria-label="Life stage"
                >
                  {LIFE_STAGES.map((s) => (
                    <div key={s.id} className="min-w-[140px] shrink-0 snap-start">
                      <SelectableCard
                        selected={draft.lifeStage === s.id}
                        onClick={() => patchDraft({ lifeStage: s.id })}
                        title={s.label}
                        description={s.hint}
                      />
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-3 sm:grid-cols-2" role="listbox" aria-label="Event type">
                  {EVENT_TYPES.map((t) => (
                    <SelectableCard
                      key={t.id}
                      selected={draft.eventType === t.id}
                      onClick={() => patchDraft({ eventType: t.id })}
                      title={t.label}
                      description={t.description}
                    />
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="listbox" aria-label="Domain">
                  {EVENT_DOMAINS.map((d) => (
                    <SelectableCard
                      key={d.id}
                      selected={draft.domain === d.id}
                      onClick={() =>
                        patchDraft({
                          domain: d.id,
                          subcategory: undefined,
                          eventLabel: undefined,
                          customEvent: false
                        })
                      }
                      title={`${d.emoji} ${d.label}`}
                    />
                  ))}
                </div>
              )}

              {step === 4 && draft.domain && (
                <div className="flex flex-wrap gap-2" role="listbox" aria-label="Subcategory">
                  {SUBCATEGORIES[draft.domain].map((sub) => (
                    <Chip
                      key={sub}
                      label={sub}
                      selected={draft.subcategory === sub}
                      onClick={() => patchDraft({ subcategory: sub, eventLabel: undefined })}
                    />
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  {draft.subcategory ? (
                    <p className="text-xs text-cg-muted">
                      Showing events for <span className="font-semibold text-cg-text">{draft.subcategory}</span>
                      {draft.domain ? ` · ${EVENT_DOMAINS.find((d) => d.id === draft.domain)?.label}` : ""}
                    </p>
                  ) : null}
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search events…"
                    aria-label="Search events"
                    className="w-full rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm shadow-[2px_2px_0_0_var(--cg-3d-border)] outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                  <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto" role="listbox" aria-label="Event">
                    {eventOptions.map((ev) => (
                      <Chip
                        key={ev}
                        label={ev}
                        selected={draft.eventLabel === ev && !draft.customEvent}
                        onClick={() =>
                          patchDraft({ eventLabel: ev, customEvent: false, customDescription: undefined })
                        }
                      />
                    ))}
                  </div>
                  {!customOpen ? (
                    <button
                      type="button"
                      onClick={() => setCustomOpen(true)}
                      className="text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
                    >
                      + Create My Own Event
                    </button>
                  ) : (
                    <div className={`${innerCardClass} space-y-3 p-3`}>
                      <input
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Event title (what happened)"
                        aria-label="Custom event title"
                        className="w-full rounded-lg border border-[var(--cg-3d-border)] px-3 py-2 text-sm"
                      />
                      <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Optional short description"
                        aria-label="Custom event description"
                        rows={2}
                        className="w-full resize-none rounded-lg border border-[var(--cg-3d-border)] px-3 py-2 text-sm"
                      />
                      <p className="text-xs font-semibold text-cg-text">Emotional tone</p>
                      <div className="flex flex-wrap gap-2">
                        {EMOTIONAL_TONES.map((tone) => (
                          <Chip
                            key={tone.id}
                            label={tone.label}
                            selected={draft.emotionalTone === tone.id}
                            onClick={() => patchDraft({ emotionalTone: tone.id as EmotionalToneId })}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-cg-text">
                        Intensity: {INTENSITY_LABELS[draft.intensity ?? 3]}
                      </p>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={draft.intensity ?? 3}
                        onChange={(e) =>
                          patchDraft({ intensity: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })
                        }
                        aria-label="Event intensity"
                        className="w-full accent-emerald-700"
                      />
                      <button
                        type="button"
                        onClick={applyCustomEvent}
                        disabled={!customTitle.trim()}
                        className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0_0_#14532d] disabled:opacity-40"
                      >
                        Use this event
                      </button>
                    </div>
                  )}
                  {draft.eventLabel && !customOpen ? (
                    <p className="text-xs font-medium text-emerald-800">
                      Selected: {draft.eventLabel}
                    </p>
                  ) : null}
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <p className="text-xs text-cg-muted">Select all areas that shifted for you.</p>
                  <div className="flex flex-wrap gap-2">
                    {IMPACT_DIMENSIONS.map((imp) => {
                      const on = draft.impacts?.includes(imp.id);
                      return (
                        <Chip
                          key={imp.id}
                          label={imp.label}
                          selected={on}
                          onClick={() => {
                            const cur = draft.impacts ?? [];
                            patchDraft({
                              impacts: on ? cur.filter((x) => x !== imp.id) : [...cur, imp.id]
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className={`${innerCardClass} p-4`}>
                    <p className="text-sm font-semibold text-cg-text">
                      Intensity: {INTENSITY_LABELS[draft.intensity ?? 3]}
                    </p>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={draft.intensity ?? 3}
                      onChange={(e) =>
                        patchDraft({ intensity: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })
                      }
                      aria-label="Impact intensity"
                      className="mt-3 w-full accent-emerald-700"
                    />
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-cg-text">How did it feel at that time?</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map((em) => {
                      const on = draft.emotions?.includes(em.id);
                      return (
                        <Chip
                          key={em.id}
                          label={em.label}
                          selected={on}
                          onClick={() => {
                            const cur = draft.emotions ?? [];
                            patchDraft({
                              emotions: on ? cur.filter((x) => x !== em.id) : [...cur, em.id]
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs font-semibold text-cg-text">How do you see it now?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {REFLECTION_LENSES.map((r) => (
                      <SelectableCard
                        key={r.id}
                        selected={draft.reflectionLens === r.id}
                        onClick={() => patchDraft({ reflectionLens: r.id })}
                        title={r.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer
          data-flow-footer
          className="relative flex justify-between gap-2 border-t-2 border-[var(--cg-3d-border)] px-5 py-3"
        >
          <button
            type="button"
            disabled={step === 1}
            onClick={back}
            className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-4 py-2 text-xs font-bold text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)] disabled:opacity-40"
          >
            Back
          </button>
          {step < STEPS ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={next}
              className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-[3px_3px_0_0_#14532d] disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={!canNext()}
              onClick={finish}
              className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-[3px_3px_0_0_#14532d] disabled:opacity-40"
            >
              Save to timeline
            </button>
          )}
        </footer>
      </motion.div>
    </div>,
    document.body
  );
}

function stepTitle(step: number) {
  const titles = [
    "When did this happen?",
    "What kind of event was it?",
    "What area was this related to?",
    "Which subcategory fits best?",
    "Select what happened",
    "What changed in you because of this?",
    "How did it feel at that time?"
  ];
  return titles[step - 1] ?? "";
}

function cnModal() {
  return [
    cardClass,
    "relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden",
    "sm:max-h-[88vh]"
  ].join(" ");
}
