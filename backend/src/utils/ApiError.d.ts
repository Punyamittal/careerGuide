export class ApiError extends Error {
  statusCode: number;
  details: unknown;
  constructor(statusCode: number, message: string, details?: unknown);
}
