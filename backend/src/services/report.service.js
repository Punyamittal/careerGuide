import { StatusCodes } from "http-status-codes";
import { ATTEMPT_STATUS } from "../constants/assessment.js";
import { mapAttemptRow, mapReportRow } from "../db/mappers.js";
import { getSupabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { generateText } from "./ai.service.js";
import { getGameSummary } from "./game.service.js";

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

const reportPrompt = (structured) => `You are a career mentor. Given this JSON profile, write a concise report using EXACTLY these section headings (in order):

1. Strengths — tie to measurable score areas; no fluff.
2. Career fit — why top career matches make sense for this profile (no company names).
3. Skill gaps — 2–4 concrete gaps inferred from scores (aptitude/personality/interests).
4. Next steps — specific actions for the next 2–4 weeks. Use intakeProfile and gameSummary (axisSignals + careerReadiness) to tailor advice to real constraints and observed performance—do not ignore stated barriers or support gaps.

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

  if (existing) return { report: mapReportRow(existing), created: false };

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

  const structuredSummary = {
    scores: attempt.scores,
    topCareers,
    profileVector: attempt.profileVector,
    intakeProfile: attempt.intakeProfile && typeof attempt.intakeProfile === "object" ? attempt.intakeProfile : {},
    gameSummary: await getGameSummary(userId)
  };

  const skillGaps = buildSkillGaps(attempt.scores, attempt.careerMatches || []);

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

  return { report: mapReportRow(inserted), created: true };
};

export const getReportById = async (id, userId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("reports").select("*").eq("id", id).eq("user_id", userId).maybeSingle();

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  if (!data) throw new ApiError(StatusCodes.NOT_FOUND, "Report not found");
  return mapReportRow(data);
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
  return mapReportRow(data);
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
