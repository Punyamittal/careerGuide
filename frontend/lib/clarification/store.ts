"use client";

import { create } from "zustand";
import type {
  ClarifyEvaluateResponse,
  ClarifyFinalizeResponse,
  ClarifyNextItem,
  ClarifyNextResponse,
  ClarificationPhase,
  FlowSessionState
} from "./types";
import {
  getClarifyNext,
  getFlowSessionState,
  postClarifyEvaluate,
  postClarifyFinalize,
  postClarifyResponse,
  unwrap
} from "./api";

interface ClarificationStore {
  flowSessionId: string | null;
  clarificationSessionId: string | null;
  phase: ClarificationPhase;
  journeyId: string | null;
  evaluateResult: ClarifyEvaluateResponse | null;
  currentItem: ClarifyNextItem | null;
  itemsRemaining: number;
  simConfig: Record<string, unknown> | null;
  finalizeResult: ClarifyFinalizeResponse | null;
  flowState: FlowSessionState | null;
  error: string | null;
  loading: boolean;

  reset: () => void;
  loadFlowState: (flowSessionId: string) => Promise<void>;
  runEvaluate: (flowSessionId: string) => Promise<ClarifyEvaluateResponse>;
  fetchNext: (flowSessionId: string) => Promise<ClarifyNextResponse>;
  submitAnswer: (
    flowSessionId: string,
    selectedOption: number
  ) => Promise<{ shouldContinue: boolean }>;
  runFinalize: (flowSessionId: string) => Promise<ClarifyFinalizeResponse>;
}

const initial = {
  flowSessionId: null as string | null,
  clarificationSessionId: null as string | null,
  phase: "idle" as ClarificationPhase,
  journeyId: null as string | null,
  evaluateResult: null as ClarifyEvaluateResponse | null,
  currentItem: null as ClarifyNextItem | null,
  itemsRemaining: 0,
  simConfig: null as Record<string, unknown> | null,
  finalizeResult: null as ClarifyFinalizeResponse | null,
  flowState: null as FlowSessionState | null,
  error: null as string | null,
  loading: false
};

export const useClarificationStore = create<ClarificationStore>((set, get) => ({
  ...initial,

  reset: () => set({ ...initial }),

  loadFlowState: async (flowSessionId) => {
    set({ loading: true, error: null, flowSessionId });
    try {
      const res = await getFlowSessionState(flowSessionId);
      const state = unwrap(res);
      set({
        flowState: state,
        clarificationSessionId: state.clarification?.clarificationSessionId ?? null
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load flow state" });
    } finally {
      set({ loading: false });
    }
  },

  runEvaluate: async (flowSessionId) => {
    set({ loading: true, error: null, phase: "evaluating", flowSessionId });
    try {
      const res = await postClarifyEvaluate(flowSessionId);
      const result = unwrap(res);
      set({
        evaluateResult: result,
        clarificationSessionId: result.clarificationSessionId,
        phase: result.skipped ? "complete" : "routing"
      });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Evaluate failed";
      set({ error: msg, phase: "error" });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  fetchNext: async (flowSessionId) => {
    set({ loading: true, error: null, phase: "routing" });
    try {
      const res = await getClarifyNext(flowSessionId);
      const next = unwrap(res);

      if (next.blockType === "complete") {
        set({ phase: "finalizing", currentItem: null, simConfig: null });
        return next;
      }

      if (next.blockType === "simulation") {
        set({
          phase: "simulation",
          journeyId: next.journeyId,
          clarificationSessionId: next.clarificationSessionId,
          simConfig: next.simConfig,
          currentItem: null
        });
        return next;
      }

      set({
        phase: "items",
        journeyId: next.journeyId,
        clarificationSessionId: next.clarificationSessionId,
        currentItem: next.items[0] ?? null,
        itemsRemaining: next.itemsRemaining,
        simConfig: null
      });
      return next;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Next block failed";
      set({ error: msg, phase: "error" });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  submitAnswer: async (flowSessionId, selectedOption) => {
    const { clarificationSessionId, journeyId, currentItem } = get();
    if (!clarificationSessionId || !journeyId || !currentItem) {
      throw new Error("No active clarification item");
    }

    set({ loading: true, error: null });
    const started = performance.now();
    try {
      const res = await postClarifyResponse(flowSessionId, {
        clarificationSessionId,
        journeyId,
        itemId: currentItem.itemId,
        selectedOption,
        responseTimeMs: Math.round(performance.now() - started)
      });
      const result = unwrap(res);
      return { shouldContinue: result.shouldContinue };
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Submit failed", phase: "error" });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  runFinalize: async (flowSessionId) => {
    set({ loading: true, error: null, phase: "finalizing" });
    try {
      const res = await postClarifyFinalize(flowSessionId);
      const result = unwrap(res);
      set({ finalizeResult: result, phase: "complete" });
      return result;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Finalize failed", phase: "error" });
      throw e;
    } finally {
      set({ loading: false });
    }
  }
}));
