import { StatusCodes } from "http-status-codes";
import { env } from "../../../config/env.js";
import { clarificationError, clarificationStatusCode } from "../constants/errorCodes.js";
import { asyncMiddleware } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";

export const requireClarificationFeature = asyncMiddleware((_req, _res, next) => {
  if (!env.clarification.featureFlag) {
    return next(clarificationError("FEATURE_DISABLED"));
  }
  return next();
});

/** Clarification persistence uses Supabase PostgreSQL. */
export const requireClarificationDb = asyncMiddleware((_req, _res, next) => {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    return next(clarificationError("MONGO_UNAVAILABLE"));
  }
  return next();
});

/** @deprecated Use requireClarificationDb */
export const requireMongo = requireClarificationDb;

export const clarificationErrorHandler = (err, _req, _res, next) => {
  if (err?.name === "ClarificationError" && err.code) {
    return next(new ApiError(clarificationStatusCode(err), err.message, err.details));
  }
  return next(err);
};
