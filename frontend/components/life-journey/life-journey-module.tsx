"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { fetchLifeJourneyEvents } from "@/lib/life-journey/api";
import { openLifeJourneyFlow, useLifeJourneyStore } from "@/lib/life-journey/store";
import { aggregateSignals } from "@/lib/life-journey/signal-engine";
import { buildCareerInfluenceSummary, generateJourneyInsights } from "@/lib/life-journey/insights";
import {
  EMOTIONS,
  EVENT_DOMAINS,
  EVENT_TYPES,
  labelForDomain,
  labelForStage,
  STAGE_ORDER
} from "@/lib/life-journey/taxonomy";
import type { LifeEventRecord, LifeStageId } from "@/lib/life-journey/types";
import {
  ActionToolbar,
  AmbientBackground,
  EmptyExperiencesPanel,
  InsightCards,
  JourneyHero,
  JourneyTimeline,
  LifeStageRail,
  ReflectionPanel,
  SectionHeader,
  SignalClusters,
} from "./life-journey-visual";
import { innerCardClass } from "./ui";

const EMOTION_COLORS: Record<string, string> = {
  proud: "bg-amber-100 border-amber-400 text-amber-950",
  happy: "bg-yellow-100 border-yellow-400 text-yellow-950",
  excited: "bg-orange-100 border-orange-400 text-orange-950",
  afraid: "bg-violet-100 border-violet-400 text-violet-950",
  hurt: "bg-rose-100 border-rose-400 text-rose-950",
  motivated: "bg-emerald-100 border-emerald-500 text-emerald-950",
  inspired: "bg-sky-100 border-sky-400 text-sky-950",
  lonely: "bg-slate-200 border-slate-400 text-slate-800",
  default: "bg-zinc-100 border-zinc-300 text-zinc-800"
};

export function LifeJourneyModule() {
  const events = useLifeJourneyStore((s) => s.events);
  const removeEvent = useLifeJourneyStore((s) => s.removeEvent);
  const mergeRemoteEvents = useLifeJourneyStore((s) => s.mergeRemoteEvents);
  const [stageFilter, setStageFilter] = useState<LifeStageId | "all">("all");
  const [wasEmpty, setWasEmpty] = useState(true);

  const signals = useMemo(() => aggregateSignals(events), [events]);
  const insights = useMemo(
    () => generateJourneyInsights(events, signals, { stageFilter }),
    [events, signals, stageFilter]
  );
  const careerSummary = useMemo(
    () => buildCareerInfluenceSummary(events, signals),
    [events, signals]
  );

  const filteredEvents = useMemo(() => {
    if (stageFilter === "all") return events;
    return events.filter((e) => e.lifeStage === stageFilter);
  }, [events, stageFilter]);

  useEffect(() => {
    void fetchLifeJourneyEvents().then((remote) => {
      if (remote.length) mergeRemoteEvents(remote);
    });
  }, [mergeRemoteEvents]);

  useEffect(() => {
    if (events.length > 0 && wasEmpty) setWasEmpty(false);
    if (events.length === 0) setWasEmpty(true);
  }, [events.length, wasEmpty]);

  const byStage = useMemo(() => {
    const map = new Map<string, LifeEventRecord[]>();
    for (const id of STAGE_ORDER) map.set(id, []);
    for (const e of events) {
      const list = map.get(e.lifeStage) ?? [];
      list.push(e);
      map.set(e.lifeStage, list);
    }
    return map;
  }, [events]);

  const isEmpty = events.length === 0;

  return (
    <div className="relative space-y-8 pb-20 md:space-y-10 md:pb-10">
      <AmbientBackground />

      <div className="relative z-10 space-y-8 pointer-events-auto md:space-y-10">
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <JourneyHero
              eventCount={events.length}
              signalCount={signals.length}
              onStart={() => openLifeJourneyFlow({ fresh: true })}
            />
          </motion.div>
        ) : (
          <motion.div
            key="toolbar"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <ActionToolbar
              eventCount={events.length}
              signalCount={signals.length}
              onAdd={() => openLifeJourneyFlow()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <LifeStageRail
        byStage={byStage}
        stageFilter={stageFilter}
        onFilter={(id) => setStageFilter(id as LifeStageId | "all")}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Experiences"
            title="Chapters you've mapped"
            subtitle={
              stageFilter === "all"
                ? "Each card holds a moment that may have shaped your inner narrative."
                : `Focused on ${labelForStage(stageFilter as LifeStageId)} — expand any card for depth.`
            }
          />
          {filteredEvents.length === 0 ? (
            <EmptyExperiencesPanel onAdd={() => openLifeJourneyFlow()} hasAny={events.length > 0} />
          ) : (
            <motion.div className="grid gap-3 sm:grid-cols-2">
              {filteredEvents.map((ev, i) => (
                <ExperienceCard
                  key={ev.id}
                  event={ev}
                  index={i}
                  onRemove={() => removeEvent(ev.id)}
                />
              ))}
            </motion.div>
          )}
        </section>

        <div className="space-y-8">
          <JourneyTimeline
            events={filteredEvents}
            stageFilter={stageFilter}
            onAdd={() => openLifeJourneyFlow()}
          />

          <div className="space-y-6 xl:hidden">
            <section className="space-y-3">
              <SectionHeader
                eyebrow="Intelligence"
                title="Emerging patterns"
                subtitle="Signals that may have shaped your growth journey — supportive, not diagnostic."
              />
              <InsightCards insights={insights} limit={4} compact />
            </section>
            <section className="space-y-3">
              <SectionHeader
                eyebrow="Psychology"
                title="Psychological signal landscape"
                subtitle="Grouped clusters mapped from your experiences (MBS-aligned)."
              />
              <SignalClusters signals={signals} onAdd={() => openLifeJourneyFlow()} />
            </section>
          </div>
        </div>
      </div>

      <ReflectionPanel
        headline={careerSummary.headline}
        bullets={careerSummary.bullets}
        explorations={careerSummary.suggestedExplorations}
      />
      </div>
    </div>
  );
}

function ExperienceCard({
  event,
  index,
  onRemove
}: {
  event: LifeEventRecord;
  index: number;
  onRemove: () => void;
}) {
  const primaryEmotion = event.emotions[0];
  const color = EMOTION_COLORS[primaryEmotion] ?? EMOTION_COLORS.default;
  const typeLabel = EVENT_TYPES.find((t) => t.id === event.eventType)?.label ?? event.eventType;
  const domainEmoji = EVENT_DOMAINS.find((d) => d.id === event.domain)?.emoji ?? "";
  const gradId = `intensity-${event.id}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3, x: -2 }}
      className={`${innerCardClass} group relative overflow-hidden p-4 transition-shadow hover:shadow-[4px_4px_0_0_var(--cg-3d-border)]`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-100/60 blur-xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <span className={`inline-flex rounded-lg border-2 px-2 py-0.5 text-[10px] font-bold ${color}`}>
          {EMOTIONS.find((e) => e.id === primaryEmotion)?.label ?? "Mixed"}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-[10px] font-bold text-rose-700 opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Remove experience"
        >
          Remove
        </button>
      </div>
      <p className="relative mt-2 line-clamp-2 font-display text-sm font-bold text-cg-text">
        {event.eventLabel}
      </p>
      <p className="relative mt-1 text-[11px] text-cg-muted">
        {domainEmoji} {labelForDomain(event.domain)} · {labelForStage(event.lifeStage)}
      </p>
      <div
        className="relative mt-3 flex items-center gap-2"
        aria-label={`Intensity ${event.intensity} of 5`}
      >
        <span className="relative flex h-9 w-9 items-center justify-center">
          <svg className="absolute inset-0 h-9 w-9 -rotate-90" viewBox="0 0 36 36" aria-hidden>
            <circle cx="18" cy="18" r="14" fill="none" stroke="#e4e4e7" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3"
              strokeDasharray={`${(event.intensity / 5) * 88} 88`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-[10px] font-bold text-emerald-900">{event.intensity}</span>
        </span>
        <div className="flex flex-1 gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < event.intensity ? "bg-emerald-500" : "bg-zinc-200"}`}
            />
          ))}
        </div>
      </div>
      <details className="relative mt-3 text-xs text-cg-muted">
        <summary className="cursor-pointer font-semibold text-cg-text">View details</summary>
        <p className="mt-2">{typeLabel}</p>
        <p className="mt-1">Impacts: {event.impacts.join(", ")}</p>
        <p className="mt-1">Now: {event.reflectionLens.replace(/_/g, " ")}</p>
        {event.customDescription ? <p className="mt-1">{event.customDescription}</p> : null}
        {event.behavioralSignals?.length ? (
          <p className="mt-1 text-[10px] text-emerald-800">
            Signals: {event.behavioralSignals.slice(0, 4).join(", ")}
          </p>
        ) : null}
      </details>
    </motion.article>
  );
}
