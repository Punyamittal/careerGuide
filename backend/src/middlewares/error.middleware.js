import { StatusCodes } from "http-status-codes";

export const notFoundHandler = (_req, _res, next) => {
  const error = new Error("Route not found");
  error.statusCode = StatusCodes.NOT_FOUND;
  next(error);
};

function formatErrorMessage(error) {
  let msg = error.message || "Internal server error";
  if (error.details != null) {
    if (Array.isArray(error.details)) {
      const parts = error.details.map((d) =>
        d && typeof d === "object" && "path" in d && "message" in d
          ? `${d.path}: ${d.message}`
          : String(d)
      );
      msg = `${msg} (${parts.join("; ")})`;
    } else if (typeof error.details === "string") {
      msg = `${msg}: ${error.details}`;
    } else {
      try {
        msg = `${msg}: ${JSON.stringify(error.details)}`;
      } catch {
        msg = `${msg} (details omitted)`;
      }
    }
  }
  return msg;
}

export const errorHandler = (error, _req, res, _next) => {
  const statusCode =
    error.statusCode ?? error.status ?? StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    data: null,
    error: formatErrorMessage(error)
  });
};
