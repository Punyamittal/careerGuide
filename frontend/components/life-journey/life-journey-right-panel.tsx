"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { openLifeJourneyFlow, useLifeJourneyStore } from "@/lib/life-journey/store";
import { aggregateSignals } from "@/lib/life-journey/signal-engine";
import { generateJourneyInsights } from "@/lib/life-journey/insights";
import { labelForStage, STAGE_ORDER } from "@/lib/life-journey/taxonomy";
import {
  InsightCards,
  SignalClusters,
  glassCard
} from "./life-journey-visual";
import { AddExperienceButton } from "./ui";

export function LifeJourneyRightPanel() {
  const events = useLifeJourneyStore((s) => s.events);

  const signals = useMemo(() => aggregateSignals(events), [events]);
  const insights = useMemo(
    () => generateJourneyInsights(events, signals, { stageFilter: "all" }),
    [events, signals]
  );
  const stageCounts = useMemo(
    () =>
      STAGE_ORDER.map((id) => ({
        id,
        label: labelForStage(id),
        count: events.filter((e) => e.lifeStage === id).length
      })).filter((c) => c.count > 0),
    [events]
  );

  const maxIntensity = events.length ? Math.max(...events.map((e) => e.intensity)) : null;
  const progress = Math.min(100, events.length * 12);

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${glassCard} relative overflow-hidden p-4`}
      >
        <motion.div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/50 blur-2xl"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
          aria-hidden
        />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
          Journey coach
        </p>
        <p className="relative mt-1 text-sm font-semibold text-cg-text">Map your next chapter</p>
        <AddExperienceButton
          onClick={openLifeJourneyFlow}
          fullWidth
          className="relative mt-3"
        />
        <Link
          href="/overview?tab=assessments"
          className="relative mt-2 block w-full rounded-xl border-2 border-[var(--cg-3d-border)] bg-white/90 py-2.5 text-center text-xs font-semibold text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)] transition hover:-translate-y-px"
        >
          Pair with assessment
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className={`${glassCard} p-4`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-cg-muted">Journey depth</p>
          <span className="text-xs font-bold text-emerald-800">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full border border-[var(--cg-3d-border)] bg-white">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(6, progress)}%` }}
          />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <SnapshotStat label="Mapped" value={String(events.length)} />
          <SnapshotStat label="Signals" value={String(signals.length)} />
          <SnapshotStat label="Peak" value={maxIntensity != null ? String(maxIntensity) : "—"} />
        </dl>
      </motion.div>

      {stageCounts.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`${glassCard} p-4`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Active chapters</p>
          <ul className="mt-3 space-y-2">
            {stageCounts.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-[var(--cg-3d-border)] bg-white/80 px-2.5 py-2 text-xs shadow-[1px_1px_0_0_var(--cg-3d-border)]"
              >
                <span className="font-medium text-cg-text">{s.label}</span>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-900">
                  {s.count}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}

      <motion.section
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2.5"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">
          Emerging patterns
        </p>
        <p className="text-[11px] leading-snug text-cg-muted">
          AI-style reflections from your mapped experiences
        </p>
        <InsightCards insights={insights} limit={3} compact />
      </motion.section>

      <motion.section
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="space-y-2.5"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">
          Signal clusters
        </p>
        <SignalClusters signals={signals} compact onAdd={openLifeJourneyFlow} />
      </motion.section>

      <p className="px-1 text-[10px] leading-relaxed text-cg-muted">
        Supportive language only — not clinical diagnosis or mental health assessment.
      </p>
    </div>
  );
}

function SnapshotStat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="rounded-lg border border-[var(--cg-3d-border)] bg-white/90 px-1 py-2 shadow-[1px_1px_0_0_var(--cg-3d-border)]"
    >
      <dt className="text-[9px] font-semibold uppercase text-cg-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-sm font-bold text-cg-text">{value}</dd>
    </motion.div>
  );
}
