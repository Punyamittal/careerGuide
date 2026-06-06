import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import type { ClarifyResponseBody, ClarifySimCompleteBody } from "../validators/clarify.validator.js";
import {
  assertAuthenticated,
  sendSuccess
} from "../middleware/clarification.middleware.js";
import { evaluateClarification } from "../services/evaluate.service.js";
import { routeClarificationNext } from "../services/next.service.js";
import { submitClarificationResponse } from "../services/response.service.js";
import { submitSimComplete } from "../services/simComplete.service.js";
import { finalizeClarificationSession } from "../services/finalize.service.js";

function flowSessionIdParam(req: Request): string {
  const value = req.params.flowSessionId;
  return Array.isArray(value) ? value[0] : String(value);
}

export const postClarifyEvaluate = asyncHandler(async (req: Request, res: Response) => {
  assertAuthenticated(req);
  const result = await evaluateClarification(flowSessionIdParam(req), req.user.id);
  return sendSuccess(res, result);
});

export const getClarifyNext = asyncHandler(async (req: Request, res: Response) => {
  assertAuthenticated(req);
  const batchSize = req.query.batchSize ? Number(req.query.batchSize) : 1;
  const result = await routeClarificationNext(flowSessionIdParam(req), req.user.id, {
    journeyId: typeof req.query.journeyId === "string" ? req.query.journeyId : undefined,
    batchSize
  });
  return sendSuccess(res, result);
});

export const postClarifyResponse = asyncHandler(async (req: Request, res: Response) => {
  assertAuthenticated(req);
  const body = req.body as ClarifyResponseBody;
  const result = await submitClarificationResponse(flowSessionIdParam(req), req.user.id, body);
  return sendSuccess(res, result);
});

export const postClarifySimComplete = asyncHandler(async (req: Request, res: Response) => {
  assertAuthenticated(req);
  const body = req.body as ClarifySimCompleteBody;
  const result = await submitSimComplete(flowSessionIdParam(req), req.user.id, body);
  return sendSuccess(res, result);
});

export const postClarifyFinalize = asyncHandler(async (req: Request, res: Response) => {
  assertAuthenticated(req);
  const result = await finalizeClarificationSession(flowSessionIdParam(req), req.user.id);
  return sendSuccess(res, result);
});
