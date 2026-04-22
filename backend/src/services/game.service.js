import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../config/supabase.js";
import { DEFAULT_GAME_MATRIX, GAME_RESULT_MATRIX } from "../constants/gameMatrix.js";
import { ApiError } from "../utils/ApiError.js";

const AXES = ["memory", "processingSpeed", "logic", "balance", "coordination", "creativity"];
const DOMAINS = ["STEM", "Business", "Social", "Arts", "Physical"];

function round(n) {
  return Math.round(n * 10) / 10;
}

function getMatrix(gameId) {
  return GAME_RESULT_MATRIX[gameId] ?? DEFAULT_GAME_MATRIX;
}

function buildSummary(rows) {
  const out = {
    totals: {
      actions: 0,
      actionsSuccess: 0,
      actionsFailure: 0,
      sessions: 0
    },
    byType: {
      iq: { actions: 0, sessions: 0, avgScore: 0, avgAccuracy: 0 },
      physiology: { actions: 0, sessions: 0, avgScore: 0, avgAccuracy: 0 }
    },
    byGame: {},
    axisSignals: Object.fromEntries(AXES.map((k) => [k, 0])),
    careerReadiness: Object.fromEntries(DOMAINS.map((k) => [k, 0]))
  };

  const axisNum = Object.fromEntries(AXES.map((k) => [k, 0]));
  const axisDen = Object.fromEntries(AXES.map((k) => [k, 0]));
  const domNum = Object.fromEntries(DOMAINS.map((k) => [k, 0]));
  const domDen = Object.fromEntries(DOMAINS.map((k) => [k, 0]));
  const scoreSums = { iq: 0, physiology: 0 };
  const accSums = { iq: 0, physiology: 0 };

  for (const r of rows) {
    const gameType = r.game_type === "physiology" ? "physiology" : "iq";
    const key = r.game_id || "unknown";
    if (!out.byGame[key]) {
      out.byGame[key] = {
        actions: 0,
        sessions: 0,
        successRate: 0,
        avgScore: 0,
        avgAccuracy: 0
      };
    }
    const bg = out.byGame[key];

    if (r.event_kind === "action") {
      out.totals.actions += 1;
      out.byType[gameType].actions += 1;
      bg.actions += 1;
      if (r.success) out.totals.actionsSuccess += 1;
      else out.totals.actionsFailure += 1;
      continue;
    }

    const score = Number(r.score ?? 0);
    const accuracy = Number(r.accuracy ?? 0);
    const perf = Math.max(0, Math.min(1, ((score / 100) * 0.65) + accuracy * 0.35));
    const matrix = getMatrix(key);

    out.totals.sessions += 1;
    out.byType[gameType].sessions += 1;
    scoreSums[gameType] += score;
    accSums[gameType] += accuracy;
    bg.sessions += 1;
    bg.avgScore += score;
    bg.avgAccuracy += accuracy;

    for (const axis of Object.keys(matrix.axis)) {
      const w = Number(matrix.axis[axis] ?? 0);
      axisNum[axis] += perf * w;
      axisDen[axis] += w;
    }
    for (const d of Object.keys(matrix.domain)) {
      const w = Number(matrix.domain[d] ?? 0);
      domNum[d] += perf * w;
      domDen[d] += w;
    }
  }

  for (const t of ["iq", "physiology"]) {
    const sessions = out.byType[t].sessions;
    out.byType[t].avgScore = sessions ? round(scoreSums[t] / sessions) : 0;
    out.byType[t].avgAccuracy = sessions ? round((accSums[t] / sessions) * 100) : 0;
  }
  for (const [gid, v] of Object.entries(out.byGame)) {
    const actions = v.actions || 0;
    const sessions = v.sessions || 0;
    v.successRate = actions ? round((rows.filter((x) => x.game_id === gid && x.event_kind === "action" && x.success).length / actions) * 100) : 0;
    v.avgScore = sessions ? round(v.avgScore / sessions) : 0;
    v.avgAccuracy = sessions ? round((v.avgAccuracy / sessions) * 100) : 0;
  }

  for (const axis of AXES) {
    out.axisSignals[axis] = axisDen[axis] ? round((axisNum[axis] / axisDen[axis]) * 100) : 0;
  }
  for (const d of DOMAINS) {
    out.careerReadiness[d] = domDen[d] ? round((domNum[d] / domDen[d]) * 100) : 0;
  }

  out.totals.actionAccuracy = out.totals.actions
    ? round((out.totals.actionsSuccess / out.totals.actions) * 100)
    : 0;

  return out;
}

export async function recordGameAction(userId, payload) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("game_events").insert({
    user_id: userId,
    game_id: payload.gameId,
    game_type: payload.gameType,
    event_kind: "action",
    success: payload.success,
    level: payload.level ?? null,
    metadata: payload.metadata ?? {}
  });
  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  return { ok: true };
}

export async function recordGameSession(userId, payload) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("game_events").insert({
    user_id: userId,
    game_id: payload.gameId,
    game_type: payload.gameType,
    event_kind: "session",
    score: payload.score,
    accuracy: payload.accuracy,
    errors: payload.errors,
    duration_seconds: payload.durationSeconds,
    level: payload.level,
    metadata: payload.metadata ?? {}
  });
  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  return { ok: true };
}

export async function getGameSummary(userId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("game_events")
    .select("game_id, game_type, event_kind, success, score, accuracy")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  return buildSummary(data ?? []);
}
