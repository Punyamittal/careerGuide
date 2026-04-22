import { StatusCodes } from "http-status-codes";
import { QUESTION_CATEGORIES } from "../constants/assessment.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * @param {Record<string, unknown>} r
 * @param {Record<string, unknown>} q
 */
function assertValidResponsePair(r, q) {
  const id = String(q._id ?? q.id);
  const cat = q.category;

  if (cat === QUESTION_CATEGORIES.WRITING) {
    if (!String(r.writingText ?? "").trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Incomplete answer for question ${id}`);
    }
    return;
  }

  if (cat === QUESTION_CATEGORIES.BIG_FIVE) {
    const lv = r.likertValue;
    if (lv == null || Number(lv) < 1 || Number(lv) > 5) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid likert for question ${id}`);
    }
    return;
  }

  if (cat === QUESTION_CATEGORIES.RIASEC) {
    if (q.useLikert && q.riasecKey) {
      const lv = r.likertValue;
      if (lv == null || Number(lv) < 1 || Number(lv) > 5) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid likert for question ${id}`);
      }
    } else if (!r.selectedOptionKey) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Missing option for question ${id}`);
    }
    return;
  }

  if (
    cat === QUESTION_CATEGORIES.APTITUDE_LOGICAL ||
    cat === QUESTION_CATEGORIES.APTITUDE_NUMERICAL ||
    cat === QUESTION_CATEGORIES.APTITUDE_VERBAL ||
    cat === QUESTION_CATEGORIES.MOTIVATION
  ) {
    if (!r.selectedOptionKey) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Missing option for question ${id}`);
    }
    return;
  }

  if (!r.selectedOptionKey) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Missing option for question ${id}`);
  }
}

/**
 * Validates every stored response against its question definition.
 * @param {{ responses?: unknown[] }} attempt
 * @param {Map<string, Record<string, unknown>>} questionById
 */
export function validateAttemptResponseValues(attempt, questionById) {
  for (const raw of attempt.responses ?? []) {
    const r = raw && typeof raw === "object" ? raw : {};
    const qid = String(r.questionId ?? r.question_id ?? "");
    const q = questionById.get(qid);
    if (!q) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Unknown question ${qid} in responses`);
    }
    assertValidResponsePair(r, q);
  }
}

/**
 * Legacy: every listed question must have a valid answer (non-adaptive full bank).
 * @param {{ responses: unknown[] }} attempt
 * @param {Array<Record<string, unknown>>} questions
 */
export function validateSubmissionReadiness(attempt, questions) {
  const byQ = new Map(
    (attempt.responses ?? []).map((r) => [String(r.questionId ?? r.question_id), r])
  );

  const missing = [];
  for (const q of questions) {
    const id = String(q._id);
    const r = byQ.get(id);
    if (!r) missing.push(id);
  }

  if (missing.length > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Incomplete assessment: ${missing.length} question(s) have no answer`
    );
  }

  const questionById = new Map(questions.map((q) => [String(q._id), q]));
  validateAttemptResponseValues(attempt, questionById);
}
