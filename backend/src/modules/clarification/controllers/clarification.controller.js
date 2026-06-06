import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import {
  evaluateClarification,
  finalizeClarificationSession,
  getFlowState
} from "../services/clarification.service.js";
import {
  routeClarificationNext,
  submitClarificationResponse,
  submitSimComplete
} from "../services/router.service.js";
import * as sessionPersistence from "../services/sessionPersistence.service.js";

export const postFlowSession = asyncHandler(async (req, res) => {
  const session = await sessionPersistence.createFlowSession(req.user.id, req.body?.intake ?? {});
  return sendSuccess(
    res,
    {
      flowSessionId: session.id,
      currentPhase: session.currentPhase,
      phases: ["0", "1", "2", "3", "4", "5", "6", "7", "7.5", "8"]
    },
    StatusCodes.CREATED
  );
});

export const getFlowSessionState = asyncHandler(async (req, res) => {
  const state = await getFlowState(req.params.flowSessionId, req.user.id);
  return sendSuccess(res, state);
});

export const patchFlowPhase = asyncHandler(async (req, res) => {
  const session = await sessionPersistence.updateFlowSession(req.params.flowSessionId, req.user.id, {
    phase: req.body.phase,
    constructSnapshot: req.body.constructSnapshot,
    telemetry: req.body.telemetry,
    validityFlags: req.body.validityFlags
  });
  return sendSuccess(res, {
    flowSessionId: session._id.toString(),
    currentPhase: session.currentPhase
  });
});

export const postClarifyEvaluate = asyncHandler(async (req, res) => {
  const result = await evaluateClarification(req.params.flowSessionId, req.user.id);
  return sendSuccess(res, result);
});

export const getClarifyNext = asyncHandler(async (req, res) => {
  const result = await routeClarificationNext(req.params.flowSessionId, req.user.id, {
    journeyId: req.query.journeyId,
    batchSize: req.query.batchSize ? Number(req.query.batchSize) : 1
  });
  return sendSuccess(res, result);
});

export const postClarifyResponse = asyncHandler(async (req, res) => {
  const result = await submitClarificationResponse(req.params.flowSessionId, req.user.id, req.body);
  return sendSuccess(res, result);
});

export const postClarifySimComplete = asyncHandler(async (req, res) => {
  const result = await submitSimComplete(req.params.flowSessionId, req.user.id, req.body);
  return sendSuccess(res, result);
});

export const postClarifyFinalize = asyncHandler(async (req, res) => {
  const result = await finalizeClarificationSession(req.params.flowSessionId, req.user.id);
  return sendSuccess(res, result);
});
