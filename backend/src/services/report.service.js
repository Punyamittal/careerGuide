import { StatusCodes } from "http-status-codes";
import { ATTEMPT_STATUS } from "../constants/assessment.js";
import { mapAttemptRow, mapReportRow } from "../db/mappers.js";
import { getSupabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { generateText } from "./ai.service.js";
import { getGameSummary } from "./game.service.js";
import { getSimulationSummary } from "./simulation.service.js";
import {
  getAttemptOccupationMatches,
  analyzeSkillGapsForOccupation,
  getRelatedOccupations
} from "./occupational/index.js";

const buildSkillGaps = (scores, topCareers) => {
  const gaps = [];
  const apt = scores?.aptitude || {};
  if ((apt.numerical ?? 0) < 60) {
    gaps.push({
      skill: "Numerical reasoning",
      priority: "high",
      rationale: "Strengthen data interpretation for analytical roles."
    });
  }
  if ((apt.verbal ?? 0) < 60) {
    gaps.push({
      skill: "Verbal communication",
      priority: "medium",
      rationale: "Practice concise writing and reading comprehension."
    });
  }
  if ((apt.logical ?? 0) < 60) {
    gaps.push({
      skill: "Logical problem solving",
      priority: "medium",
      rationale: "Structured puzzles and case drills help."
    });
  }

  const top = topCareers[0];
  if (top?.slug) {
    gaps.push({
      skill: `Domain depth: ${top.title}`,
      priority: "low",
      rationale: "Explore projects aligned with your top match."
    });
  }

  return gaps.slice(0, 8);
};

/** Dedupe by skill label (O*NET + legacy gaps often overlap). */
const mergeSkillGaps = (primary, secondary, max = 10) => {
  const seen = new Set();
  const out = [];
  for (const g of [...primary, ...secondary]) {
    const key = String(g?.skill ?? "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(g);
    if (out.length >= max) break;
  }
  return out;
};

const flattenNumericMap = (input, prefix = "") => {
  if (!input || typeof input !== "object") return [];
  return Object.entries(input).flatMap(([key, value]) => {
    const label = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "number") {
      return [{ label, value }];
    }
    if (value && typeof value === "object") {
      return flattenNumericMap(value, label);
    }
    return [];
  });
};

const calcConfidenceFromScores = (scores) => {
  const entries = flattenNumericMap(scores).map((item) => Number(item.value)).filter((v) => Number.isFinite(v));
  if (!entries.length) return 0;
  const avg = entries.reduce((sum, v) => sum + v, 0) / entries.length;
  const variance = entries.reduce((sum, v) => sum + (v - avg) ** 2, 0) / entries.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(20, Math.min(95, Math.round(100 - stdDev)));
};

const buildReasoning = (scores, topCareers) => {
  const facets = flattenNumericMap(scores).sort((a, b) => b.value - a.value).slice(0, 5);
  const factors = facets.map((facet, index) => ({
    factor: facet.label,
    weight: Math.max(10, 100 - index * 14),
    description: `${facet.label} scored ${Math.round(facet.value)}, which positively impacts fit confidence.`
  }));
  const topCareer = topCareers[0];
  const flow = [
    facets[0] ? `High ${facets[0].label} score` : "Strong profile signals",
    "Observed consistency across assessment dimensions",
    topCareer ? `Aligned to ${topCareer.title} readiness profile` : "Aligned to top career vectors"
  ];

  return {
    scoreBreakdown: facets,
    contributingFactors: factors,
    flow,
    summary:
      topCareer && facets[0]
        ? `${facets[0].label} and related strengths indicate a strong fit for ${topCareer.title}.`
        : "Assessment signals indicate clear strengths with actionable growth areas."
  };
};

const getHistoricalSummary = async (supabase, userId, currentAttemptId) => {
  const { data, error } = await supabase
    .from("test_attempts")
    .select("id, scores, created_at")
    .eq("user_id", userId)
    .eq("status", ATTEMPT_STATUS.SCORED)
    .neq("id", currentAttemptId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);

  const attempts = (data ?? []).map((row) => mapAttemptRow(row));
  const trendPoints = attempts
    .map((attempt) => {
      const values = flattenNumericMap(attempt.scores).map((entry) => entry.value);
      if (!values.length) return null;
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      return { attemptId: attempt.id, average: Math.round(average), createdAt: attempt.createdAt };
    })
    .filter(Boolean);

  return {
    attempts: trendPoints.length,
    trend: trendPoints.reverse()
  };
};

const attachReportExplanations = async (supabase, report) => {
  if (!report?._id) return report;
  const { data, error } = await supabase
    .from("report_explanations")
    .select("factor, weight, description")
    .eq("report_id", report._id)
    .order("weight", { ascending: false });
  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  return { ...report, explanations: data ?? [] };
};

const attachLiveSummaries = async (report, userId) => {
  if (!report) return report;
  const mergedStructured = {
    ...(report.structuredSummary ?? {}),
    gameSummary: await getGameSummary(userId),
    simulationSummary: await getSimulationSummary(userId)
  };
  return { ...report, structuredSummary: mergedStructured };
};

const insertReportExplanations = async (supabase, reportId, factors) => {
  if (!Array.isArray(factors) || !factors.length) return;
  const rows = factors.map((factor) => ({
    report_id: reportId,
    factor: factor.factor,
    weight: factor.weight,
    description: factor.description
  }));
  const { error } = await supabase.from("report_explanations").insert(rows);
  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
};

const reportPrompt = (structured) => `You are a career mentor. Given this JSON profile, write a concise report using EXACTLY these section headings (in order):

1. Strengths — tie to measurable score areas; no fluff.
2. Career fit — why top career matches make sense for this profile (no company names).
3. Skill gaps — 2–4 concrete gaps inferred from scores (aptitude/personality/interests).
4. Next steps — specific actions for the next 2–4 weeks. Use intakeProfile, topOccupations (O*NET), onetSkillGaps, and gameSummary (axisSignals + careerReadiness) to tailor advice—do not ignore stated barriers or support gaps.

Rules:
- Max 220 words total
- Plain text, short paragraphs or bullets
- No hallucinated employers or job guarantees
- Do not diagnose mental health; if wellbeingSelfReport is low, suggest generic self-care and speaking to a trusted adult or counsellor.

DATA:
${JSON.stringify(structured, null, 2)}`;

export const generateReportForAttempt = async ({ userId, attemptId }) => {
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase.from("reports").select("*").eq("attempt_id", attemptId).maybeSingle();

  if (existing) {
    const withExplanations = await attachReportExplanations(supabase, mapReportRow(existing));
    return { report: await attachLiveSummaries(withExplanations, userId), created: false };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, fetchErr.message);
  if (!row) throw new ApiError(StatusCodes.NOT_FOUND, "Attempt not found");

  const attempt = mapAttemptRow(row);

  if (attempt.status !== ATTEMPT_STATUS.SCORED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Attempt must be submitted and scored before generating a report"
    );
  }

  const topCareers = (attempt.careerMatches || []).slice(0, 5).map((c) => ({
    title: c.title,
    matchScore: c.matchScore,
    confidenceScore: c.confidenceScore ?? c.confidence,
    confidence: c.confidence ?? c.confidenceScore,
    slug: c.slug
  }));

  const occupationMatches = await getAttemptOccupationMatches(attemptId);
  const topOccupations = occupationMatches.slice(0, 5).map((o) => ({
    socCode: o.socCode,
    title: o.title,
    matchScore: o.matchScore,
    confidenceScore: o.confidenceScore,
    explanation: o.explanation
  }));

  let onetSkillGaps = [];
  let relatedCareers = [];
  const primarySoc = topOccupations[0]?.socCode;
  if (primarySoc && attempt.scores) {
    try {
      const gapResult = await analyzeSkillGapsForOccupation(attempt.scores, primarySoc, 6);
      onetSkillGaps = gapResult.gaps ?? [];
      const rel = await getRelatedOccupations(primarySoc, 6);
      relatedCareers = rel.related ?? [];
    } catch {
      onetSkillGaps = [];
      relatedCareers = [];
    }
  }

  const reasoning = buildReasoning(attempt.scores, topCareers);
  const historical = await getHistoricalSummary(supabase, userId, attemptId);
  const confidenceScore = calcConfidenceFromScores(attempt.scores);
  const structuredSummary = {
    scores: attempt.scores,
    topCareers,
    topOccupations,
    occupationMatchesSnapshot: topOccupations,
    onetSkillGaps,
    relatedOccupations: relatedCareers,
    profileVector: attempt.profileVector,
    intakeProfile: attempt.intakeProfile && typeof attempt.intakeProfile === "object" ? attempt.intakeProfile : {},
    gameSummary: await getGameSummary(userId),
    simulationSummary: await getSimulationSummary(userId),
    reasoning,
    confidenceScore,
    historical
  };

  const legacyGaps = buildSkillGaps(attempt.scores, attempt.careerMatches || []);
  const skillGaps = mergeSkillGaps(onetSkillGaps, legacyGaps, 10);

  const { text: aiNarrative, provider } = await generateText(reportPrompt(structuredSummary));

  const we = attempt.writingEvaluation;
  const now = new Date().toISOString();

  const { data: inserted, error: insErr } = await supabase
    .from("reports")
    .insert({
      user_id: userId,
      attempt_id: attemptId,
      structured_summary: structuredSummary,
      ai_narrative: aiNarrative,
      skill_gaps: skillGaps,
      top_careers: topCareers,
      writing_evaluation:
        we && typeof we.score === "number"
          ? { score: we.score, feedback: we.feedback }
          : null,
      ai_provider: provider,
      updated_at: now
    })
    .select("*")
    .single();

  if (insErr) throw new ApiError(StatusCodes.BAD_REQUEST, insErr.message);

  try {
    await insertReportExplanations(supabase, inserted.id, reasoning.contributingFactors);
  } catch (error) {
    await supabase.from("reports").delete().eq("id", inserted.id).eq("user_id", userId);
    throw error;
  }

  const withExplanations = await attachReportExplanations(supabase, mapReportRow(inserted));
  return { report: await attachLiveSummaries(withExplanations, userId), created: true };
};

export const getReportById = async (id, userId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("reports").select("*").eq("id", id).eq("user_id", userId).maybeSingle();

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  if (!data) throw new ApiError(StatusCodes.NOT_FOUND, "Report not found");
  const withExplanations = await attachReportExplanations(supabase, mapReportRow(data));
  return attachLiveSummaries(withExplanations, userId);
};

export const getReportByAttempt = async (attemptId, userId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("attempt_id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  if (!data) throw new ApiError(StatusCodes.NOT_FOUND, "Report not found");
  const withExplanations = await attachReportExplanations(supabase, mapReportRow(data));
  return attachLiveSummaries(withExplanations, userId);
};

export const listReportsForUser = async (userId, limit = 20) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reports")
    .select("id, attempt_id, created_at, top_careers, structured_summary")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);

  return (data ?? []).map((r) => ({
    _id: r.id,
    attemptId: r.attempt_id,
    createdAt: r.created_at,
    topCareers: r.top_careers,
    structuredSummary: r.structured_summary
      ? { scores: r.structured_summary.scores }
      : undefined
  }));
};
