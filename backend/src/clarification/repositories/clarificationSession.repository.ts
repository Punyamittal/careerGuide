import {
  CLARIFICATION_STATUS,
  FLOW_STATUS
} from "../constants/clarification.constants.js";
import { throwClarification } from "../errors/clarification.errors.js";
import type { JourneyMetaDto } from "../dtos/clarify.dto.js";
import type {
  ClarificationSession,
  ClarificationSessionRow,
  JourneyProgress
} from "../types/entities.js";
import { mapClarificationSession } from "../types/entities.js";
import { assertNoError, clarificationDb } from "./base.repository.js";
import { updateUserFlowSession } from "./userFlowSession.repository.js";

export async function findClarificationSessionByFlowId(
  flowSessionId: string,
  userId: string
): Promise<ClarificationSession | null> {
  const { data, error } = await clarificationDb()
    .from("clarification_sessions")
    .select("*")
    .eq("flow_session_id", flowSessionId)
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error, "findClarificationSessionByFlowId");
  return data ? mapClarificationSession(data as ClarificationSessionRow) : null;
}

export async function findClarificationSessionById(
  clarificationSessionId: string,
  userId: string
): Promise<ClarificationSession | null> {
  const { data, error } = await clarificationDb()
    .from("clarification_sessions")
    .select("*")
    .eq("id", clarificationSessionId)
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error, "findClarificationSessionById");
  return data ? mapClarificationSession(data as ClarificationSessionRow) : null;
}

export async function getClarificationSessionById(
  clarificationSessionId: string,
  userId: string
): Promise<ClarificationSession> {
  const session = await findClarificationSessionById(clarificationSessionId, userId);
  if (!session) throwClarification("NOT_EVALUATED", { clarificationSessionId });
  return session;
}

export async function createClarificationSessionRecord(input: {
  flowSessionId: string;
  userId: string;
  firedRules: string[];
  journeys: JourneyMetaDto[];
  maxJourneys: number;
  accommodationSnapshot: Record<string, unknown>;
}): Promise<ClarificationSession> {
  const existing = await findClarificationSessionByFlowId(input.flowSessionId, input.userId);
  if (existing) return existing;

  const journeyProgress: Record<string, JourneyProgress> = {};
  for (const journey of input.journeys) {
    journeyProgress[String(journey.journeyId)] = {
      status: "pending",
      itemsAnswered: 0,
      itemsPlanned: journey.itemsPlanned,
      simCompleted: false,
      recentItemIds: []
    };
  }

  const row = {
    flow_session_id: input.flowSessionId,
    user_id: input.userId,
    status: input.journeys.length
      ? CLARIFICATION_STATUS.EVALUATING
      : CLARIFICATION_STATUS.SKIPPED,
    fired_rules: input.firedRules,
    assigned_journeys: input.journeys.map((j) => String(j.journeyId)),
    assigned_journey_meta: input.journeys,
    max_journeys: input.maxJourneys,
    journey_progress: journeyProgress,
    accommodation_snapshot: input.accommodationSnapshot,
    evaluated_at: new Date().toISOString()
  };

  const { data, error } = await clarificationDb()
    .from("clarification_sessions")
    .insert(row)
    .select("*")
    .single();

  assertNoError(error, "createClarificationSessionRecord");

  await updateUserFlowSession(input.flowSessionId, input.userId, {
    status: FLOW_STATUS.CLARIFICATION,
    currentPhase: "7.5"
  });

  return mapClarificationSession(data as ClarificationSessionRow);
}

export async function upsertSkippedClarificationSession(
  flowSessionId: string,
  userId: string,
  reason = "no_rules_fired"
): Promise<void> {
  const { error } = await clarificationDb()
    .from("clarification_sessions")
    .upsert(
      {
        flow_session_id: flowSessionId,
        user_id: userId,
        status: CLARIFICATION_STATUS.SKIPPED,
        fired_rules: [],
        assigned_journeys: [],
        evaluated_at: new Date().toISOString(),
        fusion_result: { skipped: true, reason }
      },
      { onConflict: "flow_session_id" }
    );

  assertNoError(error, "upsertSkippedClarificationSession");
}

export async function updateClarificationSession(
  clarificationSessionId: string,
  userId: string,
  patch: Partial<{
    status: string;
    journeyProgress: Record<string, JourneyProgress>;
    fusionResult: Record<string, unknown>;
    blockedConstructs: string[];
    finalizedAt: string;
  }>
): Promise<ClarificationSession> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.journeyProgress !== undefined) row.journey_progress = patch.journeyProgress;
  if (patch.fusionResult !== undefined) row.fusion_result = patch.fusionResult;
  if (patch.blockedConstructs !== undefined) row.blocked_constructs = patch.blockedConstructs;
  if (patch.finalizedAt !== undefined) row.finalized_at = patch.finalizedAt;

  const { data, error } = await clarificationDb()
    .from("clarification_sessions")
    .update(row)
    .eq("id", clarificationSessionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  assertNoError(error, "updateClarificationSession");
  return mapClarificationSession(data as ClarificationSessionRow);
}

export async function patchJourneyProgress(
  session: ClarificationSession,
  journeyId: string,
  patch: Partial<JourneyProgress>
): Promise<ClarificationSession> {
  const nextProgress = {
    ...session.journeyProgress,
    [journeyId]: {
      ...(session.journeyProgress[journeyId] ?? {}),
      ...patch
    }
  };

  return updateClarificationSession(session.id, session.userId, {
    journeyProgress: nextProgress
  });
}

export async function finalizeClarificationSessionRecord(
  flowSessionId: string,
  userId: string,
  fusionResult: Record<string, unknown>
): Promise<{ clar: ClarificationSession; flowConstructSnapshot: Record<string, unknown> }> {
  const clar = await findClarificationSessionByFlowId(flowSessionId, userId);
  if (!clar) throwClarification("NOT_EVALUATED");
  if (clar.status === CLARIFICATION_STATUS.FINALIZED) {
    throwClarification("ALREADY_FINALIZED");
  }

  const constructScores = (fusionResult.constructScores ?? {}) as Record<
    string,
    { blocked?: boolean }
  >;
  const blockedConstructs = Object.entries(constructScores)
    .filter(([, value]) => value?.blocked)
    .map(([key]) => key);

  const updatedClar = await updateClarificationSession(clar.id, userId, {
    status: CLARIFICATION_STATUS.FINALIZED,
    fusionResult,
    blockedConstructs,
    finalizedAt: new Date().toISOString()
  });

  const flow = await updateUserFlowSession(flowSessionId, userId, {
    currentPhase: "8",
    constructSnapshot: constructScores as Record<string, unknown>
  });

  return { clar: updatedClar, flowConstructSnapshot: flow.constructSnapshot };
}

export async function skipClarificationFlow(
  flowSessionId: string,
  userId: string,
  reason = "no_rules_fired"
): Promise<void> {
  await upsertSkippedClarificationSession(flowSessionId, userId, reason);
  await updateUserFlowSession(flowSessionId, userId, { currentPhase: "8" });
}
