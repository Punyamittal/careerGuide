import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  listAssessmentModules,
  getAssessmentModule,
  createAssessmentSession,
  ingestTelemetry,
  scoreSession
} from "../services/assessmentEngine/session.service.js";

export const getModules = asyncHandler(async (req, res) => {
  const modules = await listAssessmentModules({ status: req.query.status });
  return sendSuccess(res, { modules });
});

export const getModule = asyncHandler(async (req, res) => {
  const module = await getAssessmentModule(req.params.moduleId);
  return sendSuccess(res, { module });
});

export const postSession = asyncHandler(async (req, res) => {
  const session = await createAssessmentSession(req.user.id, req.body);
  return sendSuccess(res, { session }, StatusCodes.CREATED);
});

export const postTelemetry = asyncHandler(async (req, res) => {
  const result = await ingestTelemetry(req.user.id, req.params.sessionId, req.body);
  return sendSuccess(res, result);
});

export const postScore = asyncHandler(async (req, res) => {
  const score = await scoreSession(req.user.id, req.params.sessionId, req.body?.provider ?? "rule");
  return sendSuccess(res, { score });
});
