import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import type { ActionBody } from "../validators/negotiationV2.validator.js";
import {
  completeNegotiationSession,
  getNegotiationSession,
  startNegotiationSession,
  submitNegotiationAction
} from "../services/negotiationV2.service.js";

function userId(req: Request): string {
  if (!req.user?.id) throw new Error("Unauthorized");
  return req.user.id;
}

export const postStartSession = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const data = await startNegotiationSession(userId(req), {
    flowSessionId: body.flowSessionId,
    clarificationSessionId: body.clarificationSessionId
  });
  return sendSuccess(res, data, StatusCodes.CREATED);
});

export const postAction = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ActionBody;
  const data = await submitNegotiationAction(req.params.sessionId, userId(req), {
    branch: body.branch,
    tradePackage: body.tradePackage,
    interestSummaryText: body.interestSummaryText,
    timestampMs: body.clientTimestampMs
  });
  return sendSuccess(res, data);
});

export const postComplete = asyncHandler(async (req: Request, res: Response) => {
  const data = await completeNegotiationSession(req.params.sessionId, userId(req));
  return sendSuccess(res, data);
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const data = await getNegotiationSession(req.params.sessionId, userId(req));
  return sendSuccess(res, data);
});
