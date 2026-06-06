/**
 * User Flow 6 Phase 7.5 — Clarification API client (Supabase Auth + Express backend).
 */
import { api, type ApiResponse } from "../api";
import type {
  ClarifyEvaluateResponse,
  ClarifyFinalizeResponse,
  ClarifyNextResponse,
  ClarifyResponseResult,
  ClarifySimCompleteResponse,
  FlowSessionState
} from "./types";

const V6 = "/v6";

export async function createUserFlowSession(intake?: Record<string, unknown>) {
  return api<{ flowSessionId: string; currentPhase: string; phases: string[] }>(
    `${V6}/flows/user-6/sessions`,
    { method: "POST", body: JSON.stringify({ intake: intake ?? {} }) }
  );
}

export async function getFlowSessionState(flowSessionId: string) {
  return api<FlowSessionState>(`${V6}/flows/user-6/sessions/${flowSessionId}/state`);
}

export async function patchFlowPhase(
  flowSessionId: string,
  patch: {
    phase: string;
    constructSnapshot?: Record<string, unknown>;
    telemetry?: Record<string, unknown>;
    validityFlags?: Record<string, unknown>;
  }
) {
  return api<{ flowSessionId: string; currentPhase: string }>(
    `${V6}/flows/user-6/sessions/${flowSessionId}/phase`,
    { method: "PATCH", body: JSON.stringify(patch) }
  );
}

export async function postClarifyEvaluate(flowSessionId: string) {
  return api<ClarifyEvaluateResponse>(`${V6}/session/${flowSessionId}/clarify/evaluate`, {
    method: "POST"
  });
}

export async function getClarifyNext(
  flowSessionId: string,
  opts?: { journeyId?: string; batchSize?: number }
) {
  const params = new URLSearchParams();
  if (opts?.journeyId) params.set("journeyId", opts.journeyId);
  if (opts?.batchSize != null) params.set("batchSize", String(opts.batchSize));
  const qs = params.toString();
  return api<ClarifyNextResponse>(
    `${V6}/session/${flowSessionId}/clarify/next${qs ? `?${qs}` : ""}`
  );
}

export async function postClarifyResponse(
  flowSessionId: string,
  body: {
    clarificationSessionId: string;
    journeyId: string;
    itemId: string;
    selectedOption: number | string;
    responseTimeMs?: number;
    answerChangeCount?: number;
    clientSeq?: number;
  }
) {
  return api<ClarifyResponseResult>(`${V6}/session/${flowSessionId}/clarify/response`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function postClarifySimComplete(
  flowSessionId: string,
  body: {
    clarificationSessionId: string;
    journeyId: string;
    simId: string;
    telemetry: Record<string, unknown>;
    compositeScore?: number;
    dimensionScores?: Record<string, number>;
    success?: boolean;
    durationMs?: number;
  }
) {
  return api<ClarifySimCompleteResponse>(`${V6}/session/${flowSessionId}/clarify/sim/complete`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function postClarifyFinalize(flowSessionId: string) {
  return api<ClarifyFinalizeResponse>(`${V6}/session/${flowSessionId}/clarify/finalize`, {
    method: "POST"
  });
}

export function unwrap<T>(res: ApiResponse<T>): T {
  if (!res.success || res.data === undefined) {
    throw new Error(typeof res.error === "string" ? res.error : "Clarification API error");
  }
  return res.data;
}
