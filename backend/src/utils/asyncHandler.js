/** Route handlers: (req, res) => Promise */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/** Async Express middleware: (req, res, next) => Promise — Express 4 does not catch these otherwise. */
export const asyncMiddleware = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
