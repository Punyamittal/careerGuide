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

/** Supabase/PostgREST sometimes passes plain objects into `next()`, not `Error` instances. */
function normalizeError(error) {
  if (error instanceof Error) return error;
  if (error && typeof error === "object") {
    const msg =
      typeof error.message === "string"
        ? error.message
        : typeof error.error_description === "string"
          ? error.error_description
          : "Request failed";
    const wrapped = new Error(msg);
    const code = error.statusCode ?? error.status ?? error.code;
    if (typeof code === "number") wrapped.statusCode = code;
    if (error.details != null) wrapped.details = error.details;
    return wrapped;
  }
  return new Error(String(error));
}

export const errorHandler = (error, _req, res, _next) => {
  const err = normalizeError(error);
  const statusCode =
    err.statusCode ?? err.status ?? StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    data: null,
    error: formatErrorMessage(err)
  });
};
