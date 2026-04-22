import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError.js";

export const requireRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized"));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, "Forbidden: insufficient permissions"));
  }

  return next();
};
