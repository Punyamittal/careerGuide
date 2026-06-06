import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
export function validate(schema: ZodTypeAny): RequestHandler;
