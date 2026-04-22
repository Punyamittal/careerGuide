import { StatusCodes } from "http-status-codes";
import { ATTEMPT_STATUS, PROFILE_VECTOR_KEYS, QUESTION_CATEGORIES } from "../constants/assessment.js";
import { ASSESSMENT_KEYS, ASSESSMENT_LABELS, ASSESSMENT_PLANS } from "../constants/assessmentPlans.js";
import { mapAttemptRow, mapQuestionRow } from "../db/mappers.js";
import { getSupabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { log } from "../utils/logger.js";
import { evaluateWriting } from "./ai.service.js";
import { matchCareers } from "./matching.service.js";
import { scoreAttempt } from "./scoring.service.js";
import { validateAttemptResponseValues } from "./submission.validation.js";
import { mapToVectorArray, scoresToProfileObject } from "./vector.util.js";
import { findAdaptiveProgress, isAssessmentComplete } from "./adaptive.service.js";
import { hydrateQuestionCodes } from "./questionCodeHydration.js";
import { computeStepReward, tagWritingWithRules } from "./ruleNlp.service.js";

export const createAttempt = async (userId, assessmentKey = "career_g11") => {
  if (!ASSESSMENT_KEYS.includes(assessmentKey)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid assessmentKey");
  }
  const supabase = getSupabaseAdmin();
  const extended = {
    user_id: userId,
    assessment_key: assessmentKey,
    status: ATTEMPT_STATUS.DRAFT,
    responses: [],
    session_state: { rewardPoints: 0, nlpTags: [] }
  };
  let { data, error } = await supabase.from("test_attempts").insert(extended).select("*").single();

  const errMsg = String(error?.message || "");
  if (
    error &&
    /assessment_key|session_state|Could not find the|does not exist/i.test(errMsg)
  ) {
    log("warn", "create_attempt_fallback_minimal_row", { message: error.message });
    const r2 = await supabase
      .from("test_attempts")
      .insert({
        user_id: userId,
        status: ATTEMPT_STATUS.DRAFT,
        responses: []
      })
      .select("*")
      .single();
    data = r2.data;
    error = r2.error;
    if (!error && data) {
      data = {
        ...data,
        assessment_key: assessmentKey,
        session_state: { rewardPoints: 0, nlpTags: [] }
      };
    }
  }

  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  return mapAttemptRow(data);
};

export const getAttemptForUser = async (attemptId, userId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  if (!data) throw new ApiError(StatusCodes.NOT_FOUND, "Attempt not found");
  return mapAttemptRow(data);
};

export const saveAttemptIntake = async (attemptId, userId, intakeBody) => {
  const attempt = await getAttemptForUser(attemptId, userId);
  if (attempt.status !== ATTEMPT_STATUS.DRAFT) {
    throw new ApiError(StatusCodes.CONFLICT, "Attempt is not editable");
  }
  const now = new Date().toISOString();
  const payload = { ...intakeBody, savedAt: now };
  const supabase = getSupabaseAdmin();

  let { data, error } = await supabase
    .from("test_attempts")
    .update({ intake_profile: payload, updated_at: now })
    .eq("id", attemptId)
    .eq("user_id", userId)
    .select("*")
    .single();

  const errStr = String(error?.message || "");
  if (error && /intake_profile|schema cache|does not exist|PGRST204/i.test(errStr)) {
    log("warn", "save_intake_fallback_session_state", { attemptId });
    const sessionState = { ...(attempt.sessionState || {}), intake: payload };
    const r2 = await supabase
      .from("test_attempts")
      .update({ session_state: sessionState, updated_at: now })
      .eq("id", attemptId)
      .eq("user_id", userId)
      .select("*")
      .single();
    data = r2.data;
    error = r2.error;
  }

  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  return mapAttemptRow(data);
};

const responseToPlain = (r) => ({
  questionId: r.questionId ?? r.question_id,
  category: r.category,
  selectedOptionKey: r.selectedOptionKey ?? r.selected_option_key,
  likertValue: r.likertValue ?? r.likert_value,
  writingText: r.writingText ?? r.writing_text,
  voiceTranscript: r.voiceTranscript ?? r.voice_transcript,
  mediaUrl: r.mediaUrl ?? r.media_url
});

const mergeResponses = (existing, incoming) => {
  const map = new Map(existing.map((r) => [String(responseToPlain(r).questionId), responseToPlain(r)]));
  for (const r of incoming) {
    map.set(String(r.questionId), {
      questionId: String(r.questionId),
      category: r.category,
      selectedOptionKey: r.selectedOptionKey,
      likertValue: r.likertValue,
      writingText: r.writingText,
      voiceTranscript: r.voiceTranscript,
      mediaUrl: r.mediaUrl
    });
  }
  return [...map.values()];
};

function shapeQuestionForClient(q) {
  const opts = q.options || [];
  if (String(q.category || "").startsWith("aptitude_")) {
    return {
      ...q,
      options: opts.map(({ key, text, weights }) => ({ key, text, weights }))
    };
  }
  return { ...q, options: opts };
}

/**
 * Map DB rows → external_code index, then hydrate any gaps (legacy rows without codes).
 * @param {string} assessmentKey
 * @param {object[]|null|undefined} rows
 */
function buildQuestionsByCodeFromRows(assessmentKey, rows) {
  const plan = ASSESSMENT_PLANS[assessmentKey] ?? [];
  const planSet = new Set(plan);
  const allMapped = (rows ?? []).map((row) => shapeQuestionForClient(mapQuestionRow(row)));

  const byCode = {};
  for (const q of allMapped) {
    if (q.externalCode && (planSet.size === 0 || planSet.has(q.externalCode))) {
      byCode[q.externalCode] = q;
    }
  }

  const missing = plan.filter((c) => !byCode[c]);
  if (!missing.length) return byCode;

  log("warn", "question_codes_hydrate", {
    assessmentKey,
    missingCount: missing.length,
    sample: missing.slice(0, 8)
  });
  return hydrateQuestionCodes(assessmentKey, allMapped, byCode);
}

/** Load all questions tagged for this assessment (includes branch targets). */
export async function loadQuestionsByCodeForAssessment(assessmentKey) {
  const supabase = getSupabaseAdmin();
  const plan = ASSESSMENT_PLANS[assessmentKey] ?? [];

  let { data: rows, error } = await supabase
    .from("questions")
    .select("*")
    .eq("active", true)
    .contains("assessment_keys", [assessmentKey]);

  if (error && /assessment_keys|column|does not exist/i.test(String(error.message || ""))) {
    log("warn", "questions_query_fallback_no_assessment_keys", { assessmentKey });
    const r2 = await supabase
      .from("questions")
      .select("*")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    rows = r2.data;
    error = r2.error;
  }

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);

  let byCode = buildQuestionsByCodeFromRows(assessmentKey, rows);
  let missing = plan.filter((c) => !byCode[c]);

  /* New items (e.g. APT_L_3) may exist in DB but lack this assessmentKey in assessment_keys — load full bank once. */
  if (missing.length) {
    log("warn", "question_bank_full_table_fallback", { assessmentKey, missingCodes: missing.slice(0, 10) });
    const { data: allRows, error: wideErr } = await supabase
      .from("questions")
      .select("*")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    if (wideErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, wideErr.message);
    byCode = buildQuestionsByCodeFromRows(assessmentKey, allRows);
    missing = plan.filter((c) => !byCode[c]);
  }

  if (missing.length) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      `Question bank is missing codes: ${missing.slice(0, 12).join(", ")}. Re-seed the database from the backend folder: node scripts/seed.mjs`
    );
  }

  return byCode;
}

export const saveResponses = async (attemptId, userId, responses) => {
  const attempt = await getAttemptForUser(attemptId, userId);
  if (attempt.status !== ATTEMPT_STATUS.DRAFT) {
    throw new ApiError(StatusCodes.CONFLICT, "Attempt is not editable");
  }

  const ids = responses.map((r) => r.questionId).filter(Boolean);
  const supabase = getSupabaseAdmin();
  const { data: qrows, error: qerr } = await supabase.from("questions").select("id, category").in("id", ids);

  if (qerr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, qerr.message);

  const catById = new Map((qrows ?? []).map((q) => [String(q.id), q.category]));

  const enriched = responses.map((r) => ({
    ...r,
    category: r.category || catById.get(String(r.questionId))
  }));

  for (const r of enriched) {
    if (!r.category) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Missing category for question ${r.questionId}`);
    }
  }

  const merged = mergeResponses(attempt.responses, enriched);

  const sessionState = { ...(attempt.sessionState || {}) };
  const tagSet = new Set(Array.isArray(sessionState.nlpTags) ? sessionState.nlpTags : []);
  let rewardAcc = 0;
  const qMeta = new Map((qrows ?? []).map((q) => [String(q.id), q.category]));
  for (const r of merged) {
    const cat = r.category || qMeta.get(String(r.questionId));
    const pseudoQ = { category: cat };
    rewardAcc += computeStepReward(r, pseudoQ);
    if (cat === QUESTION_CATEGORIES.WRITING && r.writingText) {
      tagWritingWithRules(r.writingText).forEach((t) => tagSet.add(t));
    }
  }
  sessionState.nlpTags = [...tagSet];
  sessionState.rewardPoints = Math.min(2000, rewardAcc);
  sessionState.assessmentKey = attempt.assessmentKey;

  const updatedAt = new Date().toISOString();
  const basePatch = { responses: merged, updated_at: updatedAt };

  let { data: updated, error } = await supabase
    .from("test_attempts")
    .update({
      ...basePatch,
      session_state: sessionState
    })
    .eq("id", attemptId)
    .eq("user_id", userId)
    .select("*")
    .single();

  const errStr = String(error?.message || "");
  if (error && /session_state|schema cache/i.test(errStr)) {
    log("warn", "save_responses_fallback_no_session_state_column", { attemptId });
    const r2 = await supabase
      .from("test_attempts")
      .update(basePatch)
      .eq("id", attemptId)
      .eq("user_id", userId)
      .select("*")
      .single();
    updated = r2.data;
    error = r2.error;
  }

  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);

  const mapped = mapAttemptRow(updated);
  return { ...mapped, sessionState };
};

export const listAssessmentQuestions = async (assessmentKey) => {
  const supabase = getSupabaseAdmin();
  let q = supabase
    .from("questions")
    .select("*")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (assessmentKey) {
    q = q.contains("assessment_keys", [assessmentKey]);
  }

  let { data: rows, error } = await q;

  if (error && assessmentKey && /assessment_keys|column|does not exist/i.test(String(error.message || ""))) {
    log("warn", "list_questions_fallback_no_assessment_keys", { assessmentKey });
    const r2 = await supabase
      .from("questions")
      .select("*")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    rows = r2.data;
    error = r2.error;
  }

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);

  let mapped = (rows ?? []).map((row) => shapeQuestionForClient(mapQuestionRow(row)));
  if (assessmentKey && mapped.length) {
    const allowed = new Set(ASSESSMENT_PLANS[assessmentKey] ?? []);
    if (allowed.size) {
      mapped = mapped.filter((x) => x.externalCode && allowed.has(x.externalCode));
    }
  }
  return mapped;
};

export const getNextAdaptiveStep = async (attemptId, userId) => {
  const attempt = await getAttemptForUser(attemptId, userId);
  if (attempt.status !== ATTEMPT_STATUS.DRAFT) {
    throw new ApiError(StatusCodes.CONFLICT, "Attempt is already submitted");
  }
  const assessmentKey = attempt.assessmentKey;
  const questionsByCode = await loadQuestionsByCodeForAssessment(assessmentKey);
  const responsesByQuestionId = new Map(
    (attempt.responses ?? []).map((r) => [String(responseToPlain(r).questionId), responseToPlain(r)])
  );
  const prog = findAdaptiveProgress(assessmentKey, questionsByCode, responsesByQuestionId);
  return {
    ...prog,
    rewardPoints: attempt.sessionState?.rewardPoints ?? 0,
    nlpTags: attempt.sessionState?.nlpTags ?? [],
    assessmentKey,
    assessmentLabel: ASSESSMENT_LABELS[assessmentKey] ?? assessmentKey
  };
};

export const submitAttempt = async (attemptId, userId) => {
  const attempt = await getAttemptForUser(attemptId, userId);
  if (attempt.status !== ATTEMPT_STATUS.DRAFT) {
    throw new ApiError(StatusCodes.CONFLICT, "Attempt already submitted");
  }

  const assessmentKey = attempt.assessmentKey;
  const questionsByCode = await loadQuestionsByCodeForAssessment(assessmentKey);
  const responsesByQuestionId = new Map(
    (attempt.responses ?? []).map((r) => [String(responseToPlain(r).questionId), responseToPlain(r)])
  );

  if (!isAssessmentComplete(assessmentKey, questionsByCode, responsesByQuestionId)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Complete every step in your assessment track before submitting (follow the adaptive prompts until done)."
    );
  }

  const ids = [...new Set((attempt.responses ?? []).map((r) => String(responseToPlain(r).questionId)))];
  const supabase = getSupabaseAdmin();
  const { data: qrows, error: qerr } = await supabase.from("questions").select("*").in("id", ids);
  if (qerr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, qerr.message);
  const questionById = new Map((qrows ?? []).map((row) => [String(row.id), mapQuestionRow(row)]));
  validateAttemptResponseValues(attempt, questionById);

  log("info", "submit_attempt_scoring", { attemptId, userId, assessmentKey, responseCount: ids.length });

  const responses = attempt.responses.map((r) => ({
    questionId: r.questionId,
    category: r.category,
    selectedOptionKey: r.selectedOptionKey,
    likertValue: r.likertValue,
    writingText: r.writingText,
    voiceTranscript: r.voiceTranscript,
    mediaUrl: r.mediaUrl
  }));

  const mcqResponses = responses.filter((r) => r.category !== QUESTION_CATEGORIES.WRITING);
  const questionIds = [...new Set(mcqResponses.map((r) => r.questionId))];

  const scores = await scoreAttempt(questionIds, mcqResponses);
  const careerMatches = await matchCareers(scores, 12);

  const profileObj = scoresToProfileObject(scores);
  const profileVector = PROFILE_VECTOR_KEYS.map((key) => ({
    key,
    value: profileObj[key] ?? 0
  }));

  const writing = responses.find((r) => r.category === QUESTION_CATEGORIES.WRITING);
  let writingEvaluation = null;
  if (writing?.writingText?.trim()) {
    const { data: qDoc } = await supabase.from("questions").select("stem").eq("id", writing.questionId).maybeSingle();
    const stem = qDoc?.stem || "Career reflection";
    writingEvaluation = await evaluateWriting(stem, writing.writingText);
  }

  const now = new Date().toISOString();
  const writingEvalPayload = writingEvaluation
    ? {
        score: writingEvaluation.score,
        feedback: writingEvaluation.feedback,
        provider: writingEvaluation.provider
      }
    : null;

  const { data: updated, error } = await supabase
    .from("test_attempts")
    .update({
      scores,
      profile_vector: profileVector,
      career_matches: careerMatches,
      status: ATTEMPT_STATUS.SCORED,
      submitted_at: now,
      scored_at: now,
      writing_evaluation: writingEvalPayload,
      updated_at: now
    })
    .eq("id", attemptId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);

  const mapped = mapAttemptRow(updated);

  return {
    attempt: mapped,
    writingEvaluation,
    userVectorPreview: mapToVectorArray(profileObj)
  };
};
