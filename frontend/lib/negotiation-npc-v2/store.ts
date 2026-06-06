"use client";

import { create } from "zustand";
import {
  completeNegotiationSession,
  startNegotiationSession,
  submitNegotiationAction
} from "./api";
import type { NegotiationActionRequest, NegotiationResultPayload, NegotiationSessionView } from "./types";
import type { NegotiationBranch, TradePackage } from "./scenario";

export type NegotiationPhase = "idle" | "playing" | "complete" | "error";

type NegotiationStore = {
  phase: NegotiationPhase;
  session: NegotiationSessionView | null;
  result: NegotiationResultPayload | null;
  error: string | null;
  loading: boolean;
  pendingTradeBranch: boolean;
  probeDraft: string;
  flowSessionId?: string;
  clarificationSessionId?: string;
  start: (opts?: { flowSessionId?: string; clarificationSessionId?: string }) => Promise<void>;
  selectAction: (branch: NegotiationBranch) => Promise<void>;
  selectTradePackage: (pkg: TradePackage) => Promise<void>;
  setProbeDraft: (text: string) => void;
  finish: () => Promise<void>;
  reset: () => void;
};

export const useNegotiationStore = create<NegotiationStore>((set, get) => ({
  phase: "idle",
  session: null,
  result: null,
  error: null,
  loading: false,
  pendingTradeBranch: false,
  probeDraft: "",
  flowSessionId: undefined,
  clarificationSessionId: undefined,

  start: async (opts) => {
    set({
      loading: true,
      error: null,
      phase: "playing",
      flowSessionId: opts?.flowSessionId,
      clarificationSessionId: opts?.clarificationSessionId
    });
    try {
      const session = await startNegotiationSession(opts);
      set({ session, loading: false, pendingTradeBranch: false, probeDraft: "" });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to start simulation",
        phase: "error",
        loading: false
      });
    }
  },

  selectAction: async (branch) => {
    const { session, probeDraft } = get();
    if (!session || session.sessionComplete) return;

    if (branch === "trade_scope_date") {
      set({ pendingTradeBranch: true });
      return;
    }

    set({ loading: true, error: null });
    try {
      const payload: NegotiationActionRequest = {
        branch,
        clientTimestampMs: Date.now()
      };
      if (branch === "probe_interests" && probeDraft.trim()) {
        payload.interestSummaryText = probeDraft.trim();
      }

      const next = await submitNegotiationAction(session.sessionId, payload);
      set({
        session: next,
        loading: false,
        pendingTradeBranch: false,
        probeDraft: "",
        result: next.result ?? get().result,
        phase: next.sessionComplete ? "complete" : "playing"
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Action failed",
        loading: false
      });
    }
  },

  selectTradePackage: async (tradePackage) => {
    const { session } = get();
    if (!session) return;
    set({ loading: true, error: null });
    try {
      const next = await submitNegotiationAction(session.sessionId, {
        branch: "trade_scope_date",
        tradePackage,
        clientTimestampMs: Date.now()
      });
      set({
        session: next,
        loading: false,
        pendingTradeBranch: false,
        result: next.result ?? get().result,
        phase: next.sessionComplete ? "complete" : "playing"
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Trade failed",
        loading: false
      });
    }
  },

  finish: async () => {
    const { session, result } = get();
    if (!session) return;
    if (result) {
      set({ phase: "complete" });
      return;
    }
    set({ loading: true });
    try {
      const finalResult = await completeNegotiationSession(session.sessionId);
      set({ result: finalResult, phase: "complete", loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Complete failed",
        loading: false
      });
    }
  },

  reset: () =>
    set({
      phase: "idle",
      session: null,
      result: null,
      error: null,
      loading: false,
      pendingTradeBranch: false,
      probeDraft: ""
    })
}));
