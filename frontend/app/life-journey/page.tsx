"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AddEventFlow } from "@/components/life-journey/add-event-flow";
import { LifeJourneyModule } from "@/components/life-journey/life-journey-module";
import { LifeJourneyRightPanel } from "@/components/life-journey/life-journey-right-panel";
import { glassCard } from "@/components/life-journey/life-journey-visual";
import { openLifeJourneyFlow } from "@/lib/life-journey/store";
import { AddExperienceButton } from "@/components/life-journey/ui";

function LifeJourneyPageContent() {
  return (
    <>
      <AddEventFlow />
      <DashboardShell right={<LifeJourneyRightPanel />}>
        <header className={`${glassCard} relative z-10 mb-8 overflow-hidden p-6 md:p-8`}>
          <motion.div
            className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl"
            animate={{ x: [0, 16, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-sky-200/35 blur-3xl"
            aria-hidden
          />
          <p className="relative text-xs font-bold uppercase tracking-[0.22em] text-emerald-800">
            Narrative intelligence
          </p>
          <h1 className="relative mt-2 font-display text-2xl font-bold tracking-tight text-cg-text md:text-3xl lg:text-4xl">
            Life Journey
          </h1>
          <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-cg-muted md:text-base">
            Map the experiences that may have shaped your motivation, confidence, and direction.
            Reflective, private, and exploratory — not journaling or diagnosis.
          </p>
          <AddExperienceButton
            onClick={() => openLifeJourneyFlow()}
            className="relative mt-5"
          />
        </header>
        <LifeJourneyModule />
      </DashboardShell>
    </>
  );
}

export default function LifeJourneyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cg-canvas text-cg-muted">
          Loading Life Journey…
        </div>
      }
    >
      <LifeJourneyPageContent />
    </Suspense>
  );
}
