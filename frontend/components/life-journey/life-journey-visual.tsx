"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import type { AggregatedSignal, JourneyInsight, LifeEventRecord, LifeStageId } from "@/lib/life-journey/types";
import type { PsychologicalSignalId } from "@/lib/life-journey/types";
import { labelForDomain, labelForStage, STAGE_ORDER } from "@/lib/life-journey/taxonomy";
import { cn } from "@/lib/utils";
import { AddExperienceButton, innerCardClass } from "./ui";

export { innerCardClass } from "./ui";

/* ── Shared tokens (neo-brutalist + soft depth) ── */
export const glassCard =
  "rounded-2xl border-2 border-[var(--cg-3d-border)] bg-white/85 shadow-[var(--cg-3d-shadow)] backdrop-blur-md";
export const glowBtn =
  "rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-[3px_3px_0_0_#14532d] transition duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#14532d,0_0_24px_rgba(16,185,129,0.35)] active:translate-x-px active:translate-y-px";

/** Subtle motion — content stays visible even if animation does not run (SSR / reduced motion). */
const fadeUp = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 }
};

const EMOTION_RING: Record<string, string> = {
  proud: "from-amber-300 to-amber-500",
  happy: "from-yellow-300 to-yellow-500",
  excited: "from-orange-300 to-orange-500",
  afraid: "from-violet-300 to-violet-500",
  hurt: "from-rose-300 to-rose-500",
  motivated: "from-emerald-300 to-emerald-600",
  inspired: "from-sky-300 to-sky-500",
  lonely: "from-slate-300 to-slate-500",
  default: "from-emerald-200 to-teal-400"
};

const SIGNAL_CLUSTERS: {
  id: string;
  label: string;
  accent: string;
  bar: string;
  signals: PsychologicalSignalId[];
}[] = [
  {
    id: "identity",
    label: "Identity",
    accent: "border-violet-200 bg-violet-50/90",
    bar: "from-violet-400 to-violet-600",
    signals: ["independence", "emotional_sensitivity"]
  },
  {
    id: "motivation",
    label: "Motivation",
    accent: "border-amber-200 bg-amber-50/90",
    bar: "from-amber-400 to-orange-500",
    signals: ["ambition", "validation_seeking"]
  },
  {
    id: "confidence",
    label: "Confidence",
    accent: "border-emerald-200 bg-emerald-50/90",
    bar: "from-emerald-400 to-teal-500",
    signals: ["confidence", "perfectionism"]
  },
  {
    id: "social",
    label: "Social",
    accent: "border-sky-200 bg-sky-50/90",
    bar: "from-sky-400 to-cyan-500",
    signals: ["belonging", "social_trust"]
  },
  {
    id: "growth",
    label: "Growth",
    accent: "border-teal-200 bg-teal-50/90",
    bar: "from-teal-400 to-emerald-600",
    signals: ["resilience", "adaptability"]
  },
  {
    id: "adaptability",
    label: "Adaptability",
    accent: "border-indigo-200 bg-indigo-50/90",
    bar: "from-indigo-400 to-violet-500",
    signals: ["adaptability", "risk_tolerance", "independence"]
  }
];

const CATEGORY_LABEL: Record<JourneyInsight["category"], string> = {
  pattern: "Emerging pattern",
  strength: "Strength signal",
  exploration: "Exploration",
  career: "Career thread"
};

const CONFIDENCE_STYLE: Record<JourneyInsight["confidence"], string> = {
  low: "bg-zinc-100 text-zinc-600",
  medium: "bg-amber-50 text-amber-900",
  high: "bg-emerald-50 text-emerald-900"
};

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden [&_*]:pointer-events-none"
      aria-hidden
    >
      <motion.div
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, 12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-16 top-32 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 18, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-amber-100/30 blur-3xl"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-emerald-400/40"
          style={{ left: `${12 + i * 14}%`, top: `${18 + (i % 3) * 22}%` }}
          animate={{ opacity: [0.2, 0.7, 0.2], y: [0, -8, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  className
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <motion.header {...fadeUp} className={cn("space-y-1", className)}>
      {eyebrow ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-800">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-lg font-bold tracking-tight text-cg-text md:text-xl">{title}</h2>
      {subtitle ? <p className="max-w-prose text-xs leading-relaxed text-cg-muted md:text-sm">{subtitle}</p> : null}
    </motion.header>
  );
}

export function JourneyHero({
  eventCount,
  signalCount,
  onStart
}: {
  eventCount: number;
  signalCount: number;
  onStart: () => void;
}) {
  const progress = Math.min(100, eventCount * 12);

  return (
    <motion.section
      {...fadeUp}
      className={cn(glassCard, "relative overflow-hidden p-6 md:p-8")}
    >
      <motion.div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-200/60 to-sky-200/40 blur-2xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <motion.div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-sky-50 text-2xl shadow-[3px_3px_0_0_var(--cg-3d-border)]"
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            ✦
          </motion.div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
            Your narrative begins here
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-cg-text md:text-3xl">
            Start mapping your story
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-cg-muted">
            Capture turning points — wins, transitions, mentors, setbacks — and discover how they may
            connect to motivation, confidence, and career direction.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <AddExperienceButton onClick={onStart} label="Start mapping your story" />
            <span className="text-xs font-medium text-cg-muted">
              Private · exploratory · non-clinical
            </span>
          </div>
        </div>

        <div className="pointer-events-none relative hidden min-w-[200px] sm:block">
          <GhostTimelinePreview />
        </div>
      </div>

      <div className="relative mt-6">
        <div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase text-cg-muted">
          <span>Journey depth</span>
          <span>{progress}% mapped</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-[var(--cg-3d-border)] bg-white">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(8, progress)}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-xs">
          <span>
            <strong className="text-cg-text">{eventCount}</strong>{" "}
            <span className="text-cg-muted">experiences</span>
          </span>
          <span>
            <strong className="text-cg-text">{signalCount}</strong>{" "}
            <span className="text-cg-muted">signal themes</span>
          </span>
        </div>
      </div>
    </motion.section>
  );
}

export function ActionToolbar({
  eventCount,
  signalCount,
  onAdd
}: {
  eventCount: number;
  signalCount: number;
  onAdd: () => void;
}) {
  return (
    <motion.div
      {...fadeUp}
      className={cn(
        glassCard,
        "sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-3 sm:static sm:p-4"
      )}
    >
      <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
        <MetricChip label="Mapped" value={eventCount} />
        <MetricChip label="Signals" value={signalCount} />
      </div>
      <AddExperienceButton onClick={onAdd} className="w-full sm:w-auto sm:px-4 sm:py-2.5" />
    </motion.div>
  );
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-[var(--cg-3d-border)] bg-white/90 px-3 py-1.5 shadow-[1px_1px_0_0_var(--cg-3d-border)]">
      <span className="text-cg-muted">{label}</span>{" "}
      <span className="font-bold text-emerald-900">{value}</span>
    </span>
  );
}

export function LifeStageRail({
  byStage,
  stageFilter,
  onFilter
}: {
  byStage: Map<string, LifeEventRecord[]>;
  stageFilter: string;
  onFilter: (id: string) => void;
}) {
  return (
    <motion.section {...fadeUp} className="space-y-3">
      <SectionHeader
        eyebrow="Life arc"
        title="Your life stages"
        subtitle="Tap a stage to focus your timeline — glowing nodes show where you've mapped experiences."
      />
      <motion.div className={cn(glassCard, "overflow-x-auto p-4 md:p-5")}>
        <div className="flex min-w-[640px] items-end gap-0">
          <StageNode
            label="All"
            count={[...byStage.values()].reduce((a, b) => a + b.length, 0)}
            selected={stageFilter === "all"}
            onClick={() => onFilter("all")}
            isConnector={false}
          />
          {STAGE_ORDER.map((stageId, i) => {
            const count = byStage.get(stageId)?.length ?? 0;
            const active = count > 0;
            return (
              <StageNode
                key={stageId}
                label={labelForStage(stageId)}
                count={count}
                selected={stageFilter === stageId}
                active={active}
                onClick={() => onFilter(stageId)}
                isConnector={i < STAGE_ORDER.length - 1}
                connectorLit={active}
              />
            );
          })}
        </div>
      </motion.div>
    </motion.section>
  );
}

function StageNode({
  label,
  count,
  selected,
  active,
  onClick,
  isConnector,
  connectorLit
}: {
  label: string;
  count: number;
  selected?: boolean;
  active?: boolean;
  onClick: () => void;
  isConnector?: boolean;
  connectorLit?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        className="group flex flex-col items-center gap-2 rounded-xl p-2 transition hover:bg-emerald-50/60"
      >
        <span className="relative flex h-11 w-11 items-center justify-center">
          {(selected || active) && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full bg-emerald-400/30 blur-md"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          )}
          <span
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition",
              selected
                ? "border-emerald-900 bg-emerald-700 text-white shadow-[2px_2px_0_0_#14532d]"
                : active
                  ? "border-emerald-600 bg-emerald-100 text-emerald-900"
                  : "border-[var(--cg-3d-border)] bg-white text-cg-muted group-hover:border-emerald-400"
            )}
          >
            {count}
          </span>
        </span>
        <span className="max-w-[72px] text-center text-[9px] font-semibold leading-tight text-cg-text">
          {label}
        </span>
      </button>
      {isConnector ? (
        <span
          className={cn(
            "mb-4 h-0.5 w-full max-w-[56px] rounded-full transition-colors",
            connectorLit ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-zinc-200"
          )}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export function JourneyTimeline({
  events,
  compact,
  onAdd,
  stageFilter = "all"
}: {
  events: LifeEventRecord[];
  compact?: boolean;
  onAdd?: () => void;
  stageFilter?: LifeStageId | "all";
}) {
  const reduceMotion = useReducedMotion();
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) =>
        STAGE_ORDER.indexOf(a.lifeStage) - STAGE_ORDER.indexOf(b.lifeStage) ||
        b.intensity - a.intensity ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const map = new Map<LifeStageId, LifeEventRecord[]>();
    for (const ev of sorted) {
      const list = map.get(ev.lifeStage) ?? [];
      list.push(ev);
      map.set(ev.lifeStage, list);
    }
    return STAGE_ORDER.filter((id) => map.has(id)).map((id) => ({
      stageId: id,
      label: labelForStage(id),
      items: map.get(id) ?? []
    }));
  }, [events]);

  const hasEvents = events.length > 0;
  const filterLabel =
    stageFilter !== "all" ? labelForStage(stageFilter as LifeStageId) : null;

  const toggleStage = (id: string) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.section {...fadeUp} className="space-y-3">
      <SectionHeader
        eyebrow="Growth arc"
        title="Your growth timeline"
        subtitle={
          filterLabel
            ? `Showing experiences from ${filterLabel} — expand chapters below.`
            : "Intensity rings and emotional color trace how each chapter may have shaped you."
        }
      />
      <div className={cn(glassCard, "relative overflow-hidden p-4 md:p-6", compact && "p-4")}>
        {!hasEvents && (
          <GhostTimelinePreview className="pointer-events-none absolute inset-4 opacity-[0.35]" />
        )}
        <div className={cn("relative", !hasEvents && "min-h-[220px]")}>
          {hasEvents ? (
            <div className="space-y-4">
              {grouped.map((group) => {
                const collapsed = collapsedStages.has(group.stageId);
                return (
                  <div key={group.stageId} className="rounded-xl border border-[var(--cg-3d-border)]/60 bg-white/50">
                    <button
                      type="button"
                      onClick={() => toggleStage(group.stageId)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                      aria-expanded={!collapsed}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                        {group.label}
                      </span>
                      <span className="text-[10px] font-semibold text-cg-muted">
                        {group.items.length} · {collapsed ? "Show" : "Hide"}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {!collapsed ? (
                        <motion.div
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-0 overflow-hidden px-1 pb-2"
                        >
                          {group.items.map((ev, i) => (
                            <TimelineEvent
                              key={ev.id}
                              event={ev}
                              index={i}
                              isLast={i === group.items.length - 1}
                            />
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative flex min-h-[180px] flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-cg-text">Your arc will glow here</p>
              <p className="mt-1 max-w-xs text-xs text-cg-muted">
                Map a turning point to see milestones cluster by life stage with intensity rings.
              </p>
              {onAdd ? (
                <AddExperienceButton onClick={onAdd} label="+ Add experience" className="mt-4" />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function TimelineEvent({
  event,
  index,
  isLast
}: {
  event: LifeEventRecord;
  index: number;
  isLast: boolean;
}) {
  const emotion = event.emotions[0] ?? "default";
  const ring = EMOTION_RING[emotion] ?? EMOTION_RING.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative flex gap-4 pb-6 last:pb-0"
    >
      <motion.div className="flex flex-col items-center">
        <span
          className={cn(
            "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br shadow-[2px_2px_0_0_var(--cg-3d-border)]",
            ring
          )}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold text-emerald-900">
            {event.intensity}
          </span>
        </span>
        {!isLast && (
          <motion.span
            className="mt-1 w-0.5 flex-1 min-h-[24px] bg-gradient-to-b from-emerald-400 to-emerald-200/50"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.04 + 0.1 }}
          />
        )}
      </motion.div>
      <motion.article
        whileHover={{ x: 2, y: -1 }}
        className={cn(innerCardClass, "flex-1 p-3 transition-shadow hover:shadow-[3px_3px_0_0_var(--cg-3d-border)]")}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
          {labelForStage(event.lifeStage)}
        </p>
        <p className="mt-0.5 font-display text-sm font-bold text-cg-text">{event.eventLabel}</p>
        <p className="mt-1 text-[11px] text-cg-muted">
          {labelForDomain(event.domain)} · {event.subcategory}
        </p>
      </motion.article>
    </motion.div>
  );
}

function GhostTimelinePreview({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none flex flex-col gap-3", className)} aria-hidden>
      {STAGE_ORDER.slice(0, 5).map((id, i) => (
        <div key={id} className="flex items-center gap-3 opacity-60">
          <span className="h-8 w-8 shrink-0 rounded-full border-2 border-dashed border-emerald-300/80 bg-emerald-50/50" />
          <motion.div
            className="h-10 flex-1 rounded-lg border border-dashed border-[var(--cg-3d-border)] bg-white/50"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity }}
          />
        </div>
      ))}
    </div>
  );
}

export function InsightCards({
  insights,
  limit,
  compact
}: {
  insights: JourneyInsight[];
  limit?: number;
  compact?: boolean;
}) {
  const list = limit ? insights.slice(0, limit) : insights;

  return (
    <div className={cn("space-y-2.5", compact && "space-y-2")}>
      {list.map((ins, i) => (
        <InsightCard key={ins.id} insight={ins} index={i} compact={compact} />
      ))}
    </div>
  );
}

export function InsightCard({
  insight,
  index,
  compact
}: {
  insight: JourneyInsight;
  index: number;
  compact?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className={cn(
        glassCard,
        "group border-l-4 border-l-emerald-600 p-3.5 transition hover:shadow-[4px_4px_0_0_var(--cg-3d-border)]",
        compact && "p-3"
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
          {CATEGORY_LABEL[insight.category]}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
            CONFIDENCE_STYLE[insight.confidence]
          )}
        >
          {insight.confidence}
        </span>
      </div>
      <p className={cn("mt-2 leading-relaxed text-cg-text", compact ? "text-xs" : "text-sm")}>
        {insight.text.replace(/\*\*/g, "")}
      </p>
      {insight.relatedSignals.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {insight.relatedSignals.slice(0, 4).map((s) => (
            <span
              key={s}
              className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2 py-0.5 text-[9px] font-semibold capitalize text-emerald-900"
            >
              {s.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </motion.article>
  );
}

export function SignalClusters({
  signals,
  compact,
  onAdd
}: {
  signals: AggregatedSignal[];
  compact?: boolean;
  onAdd?: () => void;
}) {
  const signalMap = new Map(signals.map((s) => [s.signal, s]));

  if (!signals.length) {
    return (
      <div className={cn(glassCard, "space-y-3 p-4")}>
        <p className="text-xs font-semibold text-cg-text">Signal landscape preview</p>
        <motion.div className="grid grid-cols-2 gap-2 opacity-50" aria-hidden>
          {SIGNAL_CLUSTERS.map((c) => (
            <div
              key={c.id}
              className={cn("rounded-xl border-2 border-dashed p-3", c.accent.split(" ")[0])}
            >
              <div className="h-1.5 w-2/3 rounded-full bg-zinc-200" />
              <p className="mt-2 text-[10px] font-bold text-cg-muted">{c.label}</p>
            </div>
          ))}
        </motion.div>
        <p className="text-center text-[11px] text-cg-muted">
          Map experiences to unlock your psychological signal clusters.
        </p>
        {onAdd ? (
          <AddExperienceButton onClick={onAdd} label="+ Add experience" fullWidth className="mt-1" />
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
      {SIGNAL_CLUSTERS.map((cluster, i) => {
        const clusterSignals = cluster.signals
          .map((id) => signalMap.get(id))
          .filter(Boolean) as AggregatedSignal[];
        const score =
          clusterSignals.length > 0
            ? clusterSignals.reduce((a, s) => a + s.score, 0) / clusterSignals.length
            : 0;
        const pct = Math.min(100, score * 50);

        if (!clusterSignals.length && compact) return null;

        return (
          <motion.div
            key={cluster.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            className={cn(
              "rounded-xl border-2 border-[var(--cg-3d-border)] p-3 shadow-[2px_2px_0_0_var(--cg-3d-border)] backdrop-blur-sm",
              cluster.accent
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-cg-text">{cluster.label}</p>
              <span className="text-[10px] font-semibold text-cg-muted">
                {clusterSignals.length} active
              </span>
            </div>
            <motion.div className="mt-2 h-2 overflow-hidden rounded-full border border-white/80 bg-white/60">
              <motion.div
                className={cn("h-full rounded-full bg-gradient-to-r", cluster.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, clusterSignals.length ? 12 : 4)}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            </motion.div>
            <div className="mt-2 flex flex-wrap gap-1">
              {cluster.signals.map((sid) => {
                const s = signalMap.get(sid);
                if (!s) return null;
                return (
                  <span
                    key={sid}
                    className="rounded-full border border-[var(--cg-3d-border)]/40 bg-white/70 px-2 py-0.5 text-[9px] font-medium text-cg-text"
                  >
                    {s.label}
                  </span>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function EmptyExperiencesPanel({
  onAdd,
  hasAny
}: {
  onAdd: () => void;
  hasAny: boolean;
}) {
  return (
    <motion.div
      {...fadeUp}
      className={cn(glassCard, "relative overflow-hidden p-8 text-center md:p-10")}
    >
      <GhostTimelinePreview className="pointer-events-none absolute inset-6 opacity-20" />
      <motion.div
        className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-sky-50 text-3xl shadow-[3px_3px_0_0_var(--cg-3d-border)]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ✦
      </motion.div>
      <h3 className="relative mt-4 font-display text-lg font-bold text-cg-text">
        {hasAny ? "No experiences in this chapter" : "Your timeline is ready"}
      </h3>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-cg-muted">
        {hasAny
          ? "Try another life stage, or add a moment that belongs in this period."
          : "Each experience becomes a glowing milestone — building a reflective map of who you're becoming."}
      </p>
      <AddExperienceButton
        onClick={onAdd}
        label={hasAny ? "Add for this stage" : "Add your first experience"}
        className="relative z-10 mt-6"
      />
    </motion.div>
  );
}

export function ReflectionPanel({
  headline,
  bullets,
  explorations
}: {
  headline: string;
  bullets: string[];
  explorations: string[];
}) {
  return (
    <motion.section {...fadeUp} className="space-y-3">
      <SectionHeader
        eyebrow="Career reflection"
        title="How your journey may influence direction"
        subtitle="Supportive synthesis connecting narrative patterns to career exploration — not prescriptions."
      />
      <article className={cn(glassCard, "relative overflow-hidden p-5 md:p-7")}>
        <motion.div
          className="pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full bg-amber-100/50 blur-2xl"
          aria-hidden
        />
        <h3 className="relative font-display text-lg font-bold text-cg-text md:text-xl">{headline}</h3>
        <ul className="relative mt-4 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 text-sm leading-relaxed text-cg-muted">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500" />
              {b.replace(/\*\*/g, "")}
            </li>
          ))}
        </ul>
        <p className="relative mt-5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
          Suggested explorations
        </p>
        <ul className="relative mt-2 flex flex-wrap gap-2">
          {explorations.map((x) => (
            <motion.li
              key={x}
              whileHover={{ scale: 1.03 }}
              className="rounded-full border-2 border-[var(--cg-3d-border)] bg-white px-3 py-1.5 text-xs font-medium text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)]"
            >
              {x}
            </motion.li>
          ))}
        </ul>
      </article>
    </motion.section>
  );
}

export function stripMarkdown(s: string) {
  return s.replace(/\*\*/g, "");
}
