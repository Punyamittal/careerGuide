import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getSupabaseAdmin } from "../config/supabase.js";
import { mapAttemptRow } from "../db/mappers.js";
import { ATTEMPT_STATUS } from "../constants/assessment.js";
import {
  listOccupationsPaginated,
  getOccupationBySoc,
  getActiveRelease,
  benchmarkUserAgainstOccupation,
  analyzeSkillGapsForOccupation,
  generateOccupationRoadmap,
  getRelatedOccupations,
  getAttemptOccupationMatches
} from "../services/occupational/index.js";

const resolveScoresForUser = async (userId, attemptId) => {
  if (!attemptId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "attemptId is required");
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  if (!data) throw new ApiError(StatusCodes.NOT_FOUND, "Attempt not found");
  const attempt = mapAttemptRow(data);
  if (attempt.status !== ATTEMPT_STATUS.SCORED || !attempt.scores) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Attempt must be scored");
  }
  return { scores: attempt.scores, intakeProfile: attempt.intakeProfile ?? {} };
};

export const searchOccupations = asyncHandler(async (req, res) => {
  const { q, limit, offset } = req.query;
  const result = await listOccupationsPaginated({ q, limit, offset });
  return sendSuccess(res, result);
});

export const getOccupation = asyncHandler(async (req, res) => {
  const release = await getActiveRelease();
  if (!release) {
    return sendSuccess(res, { release: null, occupation: null });
  }
  const occupation = await getOccupationBySoc(release.id, req.params.socCode);
  const related = await getRelatedOccupations(req.params.socCode, 8);
  return sendSuccess(res, { release, occupation, related: related.related });
});

export const getBenchmark = asyncHandler(async (req, res) => {
  const { attemptId } = req.query;
  const { scores } = await resolveScoresForUser(req.user.id, attemptId);
  const benchmark = await benchmarkUserAgainstOccupation(scores, req.params.socCode);
  return sendSuccess(res, { benchmark });
});

export const postSkillGaps = asyncHandler(async (req, res) => {
  const { attemptId, socCode } = req.body;
  const { scores } = await resolveScoresForUser(req.user.id, attemptId);
  const result = await analyzeSkillGapsForOccupation(scores, socCode);
  return sendSuccess(res, result);
});

export const postRoadmap = asyncHandler(async (req, res) => {
  const { attemptId, socCode } = req.body;
  const { scores, intakeProfile } = await resolveScoresForUser(req.user.id, attemptId);
  const roadmap = await generateOccupationRoadmap(scores, socCode, intakeProfile);
  return sendSuccess(res, { roadmap });
});

export const getAttemptOccupations = asyncHandler(async (req, res) => {
  const matches = await getAttemptOccupationMatches(req.params.attemptId);
  return sendSuccess(res, { matches });
});
