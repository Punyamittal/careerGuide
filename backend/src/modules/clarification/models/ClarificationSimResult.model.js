import mongoose from "mongoose";
import { createClarificationSimResultSchema } from "../schemas/clarificationSimResult.schema.js";

export const ClarificationSimResultSchema = createClarificationSimResultSchema();

export const ClarificationSimResult =
  mongoose.models.ClarificationSimResult ||
  mongoose.model("ClarificationSimResult", ClarificationSimResultSchema);
