"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EmotionalToneId, LifeEventRecord } from "./types";
import { computeEventSignals, deriveBehavioralSignals } from "./signal-engine";
import { deleteLifeJourneyEvent, syncLifeJourneyEvent } from "./api";

const FLOW_STEPS = 7;

type DraftEvent = Partial<
  Omit<LifeEventRecord, "id" | "createdAt" | "updatedAt" | "signalMap" | "behavioralSignals">
> & {
  flowStep?: number;
};

type LifeJourneyState = {
  events: LifeEventRecord[];
  draft: DraftEvent;
  flowOpen: boolean;
  setFlowOpen: (open: boolean) => void;
  resetDraft: () => void;
  patchDraft: (patch: DraftEvent) => void;
  setFlowStep: (step: number) => void;
  addEventFromDraft: () => LifeEventRecord | null;
  removeEvent: (id: string) => void;
  hydrateEvents: (events: LifeEventRecord[]) => void;
  mergeRemoteEvents: (remote: LifeEventRecord[]) => void;
};

const emptyDraft = (): DraftEvent => ({
  lifeStage: undefined,
  eventType: undefined,
  domain: undefined,
  subcategory: undefined,
  eventLabel: undefined,
  customDescription: undefined,
  emotionalTone: undefined,
  impacts: [],
  intensity: 3,
  emotions: [],
  reflectionLens: undefined,
  flowStep: 1
});

export function mergeLifeJourneyEvents(
  local: LifeEventRecord[],
  remote: LifeEventRecord[]
): LifeEventRecord[] {
  const byId = new Map<string, LifeEventRecord>();
  for (const e of remote) byId.set(e.id, e);
  for (const e of local) {
    const existing = byId.get(e.id);
    if (!existing || new Date(e.updatedAt) >= new Date(existing.updatedAt)) {
      byId.set(e.id, e);
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Open add-experience modal; resumes in-progress draft unless `fresh` is true. */
export function openLifeJourneyFlow(options?: { fresh?: boolean }) {
  const { resetDraft, setFlowOpen, draft, setFlowStep } = useLifeJourneyStore.getState();
  if (options?.fresh) {
    resetDraft();
  } else {
    const hasProgress =
      (draft.flowStep ?? 1) > 1 ||
      Boolean(
        draft.lifeStage ||
          draft.eventType ||
          draft.domain ||
          draft.subcategory ||
          draft.eventLabel
      );
    if (!hasProgress) resetDraft();
    else setFlowStep(Math.min(FLOW_STEPS, Math.max(1, draft.flowStep ?? 1)));
  }
  setFlowOpen(true);
}

export const useLifeJourneyStore = create<LifeJourneyState>()(
  persist(
    (set, get) => ({
      events: [],
      draft: emptyDraft(),
      flowOpen: false,
      setFlowOpen: (flowOpen) => set({ flowOpen }),
      resetDraft: () => set({ draft: emptyDraft() }),
      patchDraft: (patch) =>
        set((s) => ({
          draft: { ...s.draft, ...patch, updatedAt: undefined }
        })),
      setFlowStep: (step) =>
        set((s) => ({
          draft: {
            ...s.draft,
            flowStep: Math.min(FLOW_STEPS, Math.max(1, step))
          }
        })),
      addEventFromDraft: () => {
        const d = get().draft;
        if (
          !d.lifeStage ||
          !d.eventType ||
          !d.domain ||
          !d.subcategory ||
          !d.eventLabel ||
          !d.impacts?.length ||
          !d.emotions?.length ||
          !d.reflectionLens ||
          !d.intensity
        ) {
          return null;
        }
        const signalMap = computeEventSignals({
          domain: d.domain,
          eventType: d.eventType,
          eventLabel: d.eventLabel,
          subcategory: d.subcategory,
          impacts: d.impacts,
          intensity: d.intensity,
          emotions: d.emotions,
          reflectionLens: d.reflectionLens,
          emotionalTone: d.emotionalTone
        });
        const behavioralSignals = deriveBehavioralSignals({
          eventLabel: d.eventLabel,
          subcategory: d.subcategory,
          signalMap
        });
        const now = new Date().toISOString();
        const record: LifeEventRecord = {
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          lifeStage: d.lifeStage,
          eventType: d.eventType,
          domain: d.domain,
          subcategory: d.subcategory,
          eventLabel: d.eventLabel,
          customEvent: Boolean(d.customEvent),
          customDescription: d.customDescription?.trim() || undefined,
          emotionalTone: d.emotionalTone as EmotionalToneId | undefined,
          impacts: d.impacts,
          intensity: d.intensity as LifeEventRecord["intensity"],
          emotions: d.emotions,
          reflectionLens: d.reflectionLens,
          signalMap,
          behavioralSignals,
          notes: d.notes
        };
        set((s) => ({
          events: [record, ...s.events],
          draft: emptyDraft(),
          flowOpen: false
        }));
        void syncLifeJourneyEvent(record);
        return record;
      },
      removeEvent: (id) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
        void deleteLifeJourneyEvent(id);
      },
      hydrateEvents: (events) => set({ events }),
      mergeRemoteEvents: (remote) =>
        set((s) => ({ events: mergeLifeJourneyEvents(s.events, remote) }))
    }),
    {
      name: "cg_life_journey_v1",
      partialize: (state) => ({
        events: state.events,
        draft: state.draft
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<LifeJourneyState>),
        flowOpen: current.flowOpen
      })
    }
  )
);
