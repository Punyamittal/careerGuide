import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../../config/supabase.js";
import { ApiError } from "../../utils/ApiError.js";
import { MBS_MODULE_REGISTRY, getModuleById } from "../../constants/mbsModuleRegistry.js";
import { scoreAssessmentFromTelemetry } from "./ruleScoring.service.js";
import { materializeLearnerMbsProfile } from "../mbs/profileMaterialization.service.js";
import { log } from "../../utils/logger.js";
import { getModuleContent } from "../assessmentBank.service.js";
import { parseFlowBlockModuleId } from "../../modules/assessment-bank/userFlowConstants.js";
import { getUserFlowBlockContentByModuleId } from "../../modules/assessment-bank/userFlowLoader.js";

function resolveModuleMeta(moduleId) {
  if (parseFlowBlockModuleId(moduleId)) {
    const block = getUserFlowBlockContentByModuleId(moduleId);
    if (!block) return null;
    return {
      id: moduleId,
      engineType: block.engineType ?? "likert",
      constructTags: block.config?.scoring?.constructs ?? ["USER_FLOW"]
    };
  }
  return getModuleById(moduleId);
}

export async function listAssessmentModules({ status } = {}) {
  let modules = MBS_MODULE_REGISTRY;
  if (status) modules = modules.filter((m) => m.status === status);
  return modules.map((m) => {
    const bank = getModuleContent(m.id);
    return {
      id: m.id,
      productCode: m.productCode,
      title: m.title,
      engineType: bank?.engineType ?? m.engineType,
      constructTags: m.constructTags,
      mbsDomainHints: m.mbsDomainHints,
      difficultyTier: m.difficultyTier,
      estimatedMinutes: m.estimatedMinutes,
      status: m.status,
      contentSource: bank?.source ?? "static_fallback",
      archiveItemCount: bank?.itemCount ?? 0,
      bankVersion: bank?.bankVersion ?? null
    };
  });
}

export async function getAssessmentModule(moduleId) {
  const mod = getModuleById(moduleId);
  if (!mod) throw new ApiError(StatusCodes.NOT_FOUND, "Module not found");
  const bank = getModuleContent(mod.id);
  return {
    ...mod,
    engineType: bank?.engineType ?? mod.engineType,
    contentSource: bank?.source ?? "static_fallback",
    archiveItemCount: bank?.itemCount ?? 0,
    bankVersion: bank?.bankVersion ?? null
  };
}

export async function createAssessmentSession(userId, { moduleId, trackId, clientMeta }) {
  const mod = resolveModuleMeta(moduleId);
  if (!mod) throw new ApiError(StatusCodes.BAD_REQUEST, "Unknown moduleId");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("assessment_sessions")
    .insert({
      user_id: userId,
      module_id: mod.id,
      track_id: trackId ?? null,
      client_meta: clientMeta ?? {}
    })
    .select("*")
    .single();

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  return data;
}

export async function ingestTelemetry(userId, sessionId, { events, clientSeq, adaptiveState }) {
  const supabase = getSupabaseAdmin();
  const { data: session, error: sessErr } = await supabase
    .from("assessment_sessions")
    .select("id, user_id, module_id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, sessErr.message);
  if (!session) throw new ApiError(StatusCodes.NOT_FOUND, "Session not found");

  const rows = (events ?? []).map((e) => ({
    session_id: sessionId,
    user_id: userId,
    module_id: session.module_id,
    item_id: e.itemId ?? null,
    event_type: e.eventType,
    stimulus_id: e.stimulusId ?? null,
    response_value: e.responseValue ?? null,
    response_correct: e.responseCorrect ?? null,
    response_time_ms: e.responseTimeMs ?? null,
    attempt_index: e.attemptIndex ?? 1,
    difficulty_level: e.difficultyLevel ?? null,
    engine_type: e.engineType ?? null,
    metadata: e.metadata ?? {},
    client_seq: clientSeq ?? null
  }));

  if (rows.length) {
    const { error } = await supabase.from("assessment_telemetry_events").insert(rows);
    if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }

  if (adaptiveState) {
    await supabase.from("assessment_adaptive_state").upsert({
      session_id: sessionId,
      state: adaptiveState,
      updated_at: new Date().toISOString()
    });
  }

  return { ingested: rows.length };
}

/**
 * Rule-based scoring (source of truth) with optional client summary validation.
 * @param {string} userId
 * @param {string} sessionId
 * @param {{ provider?: string; clientSummary?: Record<string, unknown> }} [opts]
 */
export async function scoreSession(userId, sessionId, opts = {}) {
  const provider = opts.provider ?? "rule";
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessErr } = await supabase
    .from("assessment_sessions")
    .select("id, module_id, user_id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, sessErr.message);
  if (!session) throw new ApiError(StatusCodes.NOT_FOUND, "Session not found");

  const mod = resolveModuleMeta(session.module_id);
  if (!mod) throw new ApiError(StatusCodes.BAD_REQUEST, "Unknown module for session");

  let { data: events, error: evErr } = await supabase
    .from("assessment_telemetry_events")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true });

  if (evErr && /recorded_at|created_at|does not exist/i.test(String(evErr.message || ""))) {
    ({ data: events, error: evErr } = await supabase
      .from("assessment_telemetry_events")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", userId));
  }

  if (evErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, evErr.message);

  const scored = scoreAssessmentFromTelemetry(mod, events ?? [], {
    clientSummary: opts.clientSummary
  });

  if (scored.summary.itemsAnswered === 0 && !opts.clientSummary) {
    log("warn", "assessment_score_no_responses", { sessionId, moduleId: mod.id });
  }

  const { data: scoreRow, error: insErr } = await supabase
    .from("assessment_module_scores")
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        module_id: session.module_id,
        scoring_provider: provider,
        construct_scores: scored.constructScores,
        summary: scored.summary,
        accuracy: scored.accuracy,
        mean_response_time_ms: scored.meanRt,
        difficulty_reached: scored.difficultyReached
      },
      { onConflict: "session_id" }
    )
    .select("*")
    .single();

  if (insErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, insErr.message);

  await supabase
    .from("assessment_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  try {
    await materializeLearnerMbsProfile(userId);
  } catch (profileErr) {
    log("error", "learner_mbs_profile_materialization_failed", {
      userId,
      message: profileErr.message
    });
  }

  return scoreRow;
}
