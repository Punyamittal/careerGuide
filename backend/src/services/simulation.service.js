import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";

function isMissingSimulationTable(error) {
  const msg = String(error?.message || "");
  return /career_simulation_sessions|schema cache|does not exist|PGRST/i.test(msg);
}

export async function recordSimulationSession(userId, payload) {
  if (Number(payload.scenesCompleted) > Number(payload.totalScenes)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "scenesCompleted cannot be greater than totalScenes");
  }

  const supabase = getSupabaseAdmin();
  const insertRow = {
    user_id: userId,
    role_slug: payload.roleSlug,
    role_title: payload.roleTitle,
    tone: payload.tone,
    completion_score: payload.completionScore ?? 0,
    choices: payload.choices ?? {},
    scenes_completed: payload.scenesCompleted,
    total_scenes: payload.totalScenes,
    duration_seconds: payload.durationSeconds ?? null
  };

  const { error } = await supabase.from("career_simulation_sessions").insert(insertRow);
  if (error && isMissingSimulationTable(error)) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      "Simulation storage is unavailable. Run latest migrations and retry."
    );
  }
  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  return { ok: true };
}

export async function getSimulationSummary(userId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("career_simulation_sessions")
    .select("role_slug, role_title, tone, completion_score, scenes_completed, total_scenes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingSimulationTable(error)) {
      return {
        totals: { sessions: 0, avgCompletionScore: 0, topTone: "N/A" },
        latest: null
      };
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }

  const rows = data ?? [];
  const totals = {
    sessions: rows.length,
    avgCompletionScore: rows.length
      ? Math.round(rows.reduce((sum, row) => sum + Number(row.completion_score || 0), 0) / rows.length)
      : 0,
    topTone:
      Object.entries(
        rows.reduce((acc, row) => {
          const tone = String(row.tone || "balanced");
          acc[tone] = (acc[tone] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "balanced"
  };

  return {
    totals,
    latest: rows[0]
      ? {
          roleSlug: rows[0].role_slug,
          roleTitle: rows[0].role_title,
          tone: rows[0].tone,
          completionScore: Number(rows[0].completion_score || 0),
          scenesCompleted: Number(rows[0].scenes_completed || 0),
          totalScenes: Number(rows[0].total_scenes || 0),
          createdAt: rows[0].created_at
        }
      : null
  };
}
