import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../../config/supabase.js";
import { ApiError } from "../../utils/ApiError.js";
import { MBS_MODULE_REGISTRY, getModuleById } from "../../constants/mbsModuleRegistry.js";

export async function listAssessmentModules({ status } = {}) {
  let modules = MBS_MODULE_REGISTRY;
  if (status) modules = modules.filter((m) => m.status === status);
  return modules.map((m) => ({
    id: m.id,
    productCode: m.productCode,
    title: m.title,
    engineType: m.engineType,
    constructTags: m.constructTags,
    mbsDomainHints: m.mbsDomainHints,
    difficultyTier: m.difficultyTier,
    estimatedMinutes: m.estimatedMinutes,
    status: m.status
  }));
}

export async function getAssessmentModule(moduleId) {
  const mod = getModuleById(moduleId);
  if (!mod) throw new ApiError(StatusCodes.NOT_FOUND, "Module not found");
  return mod;
}

export async function createAssessmentSession(userId, { moduleId, trackId, clientMeta }) {
  const mod = getModuleById(moduleId);
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

/** Rule-based scoring stub — Phase 1 */
export async function scoreSession(userId, sessionId, provider = "rule") {
  const supabase = getSupabaseAdmin();
  const { data: events, error } = await supabase
    .from("assessment_telemetry_events")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("event_type", "response");

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);

  const rts = events.filter((e) => e.response_time_ms != null).map((e) => e.response_time_ms);
  const correct = events.filter((e) => e.response_correct === true).length;
  const total = events.length || 1;
  const accuracy = correct / total;
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;

  const { data: session } = await supabase
    .from("assessment_sessions")
    .select("module_id")
    .eq("id", sessionId)
    .single();

  const mod = getModuleById(session?.module_id);
  const constructScores = {};
  for (const tag of mod?.constructTags ?? []) {
    constructScores[tag] = Math.round(accuracy * 100) / 100;
  }

  const { data: scoreRow, error: insErr } = await supabase
    .from("assessment_module_scores")
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        module_id: session.module_id,
        scoring_provider: provider,
        construct_scores: constructScores,
        summary: { accuracy, meanRt, eventCount: events.length },
        accuracy,
        mean_response_time_ms: meanRt,
        difficulty_reached: Math.max(0, ...(events.map((e) => e.difficulty_level ?? 0)))
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

  return scoreRow;
}
