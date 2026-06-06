import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncMiddleware } from "../../utils/asyncHandler.js";
import {
  ClarificationError,
  clarificationStatusCode
} from "../errors/clarification.errors.js";

export const requireClarificationFeature = asyncMiddleware(
  (_req: Request, _res: Response, next: NextFunction) => {
    if (!env.clarification.featureFlag) {
      return next(new ClarificationError("FEATURE_DISABLED"));
    }
    return next();
  }
);

/** Clarification persistence uses Supabase PostgreSQL (service role). */
export const requireClarificationDb = asyncMiddleware(
  (_req: Request, _res: Response, next: NextFunction) => {
    if (!env.supabase.url || !env.supabase.serviceRoleKey) {
      return next(new ClarificationError("MONGO_UNAVAILABLE"));
    }
    return next();
  }
);

/** @deprecated Use requireClarificationDb — kept for route compatibility. */
export const requireMongo = requireClarificationDb;

export function clarificationErrorHandler(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (err instanceof ClarificationError) {
    return next(
      new ApiError(clarificationStatusCode(err), err.message, err.details)
    );
  }
  return next(err);
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = StatusCodes.OK
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null
  });
}

export function assertAuthenticated(req: Request): asserts req is Request & { user: { id: string } } {
  if (!req.user?.id) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }
}
