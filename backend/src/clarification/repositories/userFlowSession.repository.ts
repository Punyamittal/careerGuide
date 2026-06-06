import {
  FLOW_ID_USER_6,
  FLOW_STATUS
} from "../constants/clarification.constants.js";
import { throwClarification } from "../errors/clarification.errors.js";
import type { UserFlowSession, UserFlowSessionRow } from "../types/entities.js";
import { mapUserFlowSession } from "../types/entities.js";
import { assertNoError, clarificationDb, maybeRow } from "./base.repository.js";

export async function createUserFlowSession(
  userId: string,
  intake: Record<string, unknown> = {}
): Promise<UserFlowSession> {
  const accommodation = intake.accommodation as Record<string, unknown> | undefined;
  const extendedTime = Boolean(accommodation?.extended_time);

  const row = {
    user_id: userId,
    flow_id: FLOW_ID_USER_6,
    status: FLOW_STATUS.IN_PROGRESS,
    current_phase: "0",
    intake_meta: {
      role_target: intake.role_target ?? null,
      region: intake.region ?? "IN",
      declared_sector: intake.declared_sector ?? null,
      target_sector: intake.target_sector ?? intake.declared_sector ?? null,
      single_offer_flag: intake.single_offer_flag ?? false
    },
    accommodation: {
      extended_time: extendedTime,
      latency_penalty_disabled: accommodation?.latency_penalty_disabled ?? false,
      time_multiplier: extendedTime ? 1.5 : 1.0
    }
  };

  const { data, error } = await clarificationDb()
    .from("user_flow_sessions")
    .insert(row)
    .select("*")
    .single();

  assertNoError(error, "createUserFlowSession");
  return mapUserFlowSession(data as UserFlowSessionRow);
}

export async function findUserFlowSession(
  flowSessionId: string,
  userId: string
): Promise<UserFlowSession | null> {
  const { data, error } = await clarificationDb()
    .from("user_flow_sessions")
    .select("*")
    .eq("id", flowSessionId)
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error, "findUserFlowSession");
  return data ? mapUserFlowSession(data as UserFlowSessionRow) : null;
}

export async function getUserFlowSession(
  flowSessionId: string,
  userId: string
): Promise<UserFlowSession> {
  const session = await findUserFlowSession(flowSessionId, userId);
  if (!session) throwClarification("SESSION_NOT_FOUND", { flowSessionId });
  return session;
}

export async function updateUserFlowSession(
  flowSessionId: string,
  userId: string,
  patch: Partial<{
    status: string;
    currentPhase: string;
    phaseProgress: Record<string, unknown>;
    constructSnapshot: Record<string, unknown>;
    validityFlags: Record<string, unknown>;
    telemetry: Record<string, unknown>;
    accommodation: Record<string, unknown>;
    completedAt: string | null;
  }>
): Promise<UserFlowSession> {
  const existing = await getUserFlowSession(flowSessionId, userId);

  const row: Record<string, unknown> = {};

  if (patch.status !== undefined) row.status = patch.status;
  if (patch.currentPhase !== undefined) row.current_phase = patch.currentPhase;
  if (patch.completedAt !== undefined) row.completed_at = patch.completedAt;

  if (patch.phaseProgress !== undefined) {
    row.phase_progress = { ...existing.phaseProgress, ...patch.phaseProgress };
  }
  if (patch.constructSnapshot !== undefined) {
    row.construct_snapshot = {
      ...existing.constructSnapshot,
      ...patch.constructSnapshot
    };
  }
  if (patch.validityFlags !== undefined) {
    row.validity_flags = { ...existing.validityFlags, ...patch.validityFlags };
  }
  if (patch.telemetry !== undefined) {
    row.telemetry = { ...existing.telemetry, ...patch.telemetry };
  }
  if (patch.accommodation !== undefined) {
    row.accommodation = { ...existing.accommodation, ...patch.accommodation };
  }

  const { data, error } = await clarificationDb()
    .from("user_flow_sessions")
    .update(row)
    .eq("id", flowSessionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  assertNoError(error, "updateUserFlowSession");
  return mapUserFlowSession(data as UserFlowSessionRow);
}

export async function patchFlowPhase(
  flowSessionId: string,
  userId: string,
  patch: {
    phase?: string;
    constructSnapshot?: Record<string, unknown>;
    telemetry?: Record<string, unknown>;
    validityFlags?: Record<string, unknown>;
  }
): Promise<UserFlowSession> {
  const session = await getUserFlowSession(flowSessionId, userId);
  const phase = patch.phase;
  let currentPhase = session.currentPhase;

  const phaseProgress = { ...session.phaseProgress };
  if (phase) {
    phaseProgress[phase] = {
      ...(phaseProgress[phase] as Record<string, unknown>),
      completedAt: new Date().toISOString()
    };
    currentPhase = phase;
    if (phase === "7") currentPhase = "7.5";
  }

  return updateUserFlowSession(flowSessionId, userId, {
    currentPhase,
    phaseProgress,
    constructSnapshot: patch.constructSnapshot,
    telemetry: patch.telemetry,
    validityFlags: patch.validityFlags
  });
}

export async function listUserFlowSessions(
  userId: string,
  limit = 10
): Promise<UserFlowSession[]> {
  const { data, error } = await clarificationDb()
    .from("user_flow_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  assertNoError(error, "listUserFlowSessions");
  return (data ?? []).map((row: UserFlowSessionRow) => mapUserFlowSession(row));
}

export { maybeRow };
