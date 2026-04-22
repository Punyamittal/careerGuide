import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  createAttempt,
  getAttemptForUser,
  getNextAdaptiveStep,
  listAssessmentQuestions,
  saveAttemptIntake,
  saveResponses,
  submitAttempt
} from "../services/test.service.js";

export const startAttempt = asyncHandler(async (req, res) => {
  const assessmentKey = req.body?.assessmentKey ?? "career_g11";
  const attempt = await createAttempt(req.user.id, assessmentKey);
  return sendSuccess(
    res,
    {
      attempt: {
        id: String(attempt._id),
        status: attempt.status,
        assessmentKey: attempt.assessmentKey
      }
    },
    StatusCodes.CREATED
  );
});

export const getNextQuestion = asyncHandler(async (req, res) => {
  const step = await getNextAdaptiveStep(req.params.attemptId, req.user.id);
  return sendSuccess(res, step);
});

export const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await getAttemptForUser(req.params.attemptId, req.user.id);
  return sendSuccess(res, { attempt });
});

export const getQuestions = asyncHandler(async (req, res) => {
  const assessmentKey = req.query?.assessmentKey;
  const questions = await listAssessmentQuestions(assessmentKey);
  return sendSuccess(res, { questions });
});

export const patchResponses = asyncHandler(async (req, res) => {
  const attempt = await saveResponses(req.params.attemptId, req.user.id, req.body.responses);
  return sendSuccess(res, { attempt });
});

export const patchIntake = asyncHandler(async (req, res) => {
  const attempt = await saveAttemptIntake(req.params.attemptId, req.user.id, req.body);
  return sendSuccess(res, { attempt });
});

export const postSubmit = asyncHandler(async (req, res) => {
  const result = await submitAttempt(req.params.attemptId, req.user.id);
  return sendSuccess(res, {
    attempt: result.attempt,
    writingEvaluation: result.writingEvaluation,
    userVectorPreview: result.userVectorPreview
  });
});
