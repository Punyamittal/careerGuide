import mongoose from "mongoose";
import { createClarificationSessionSchema } from "../schemas/clarificationSession.schema.js";
import { JourneyProgressSchema } from "../schemas/shared.schema.js";

export const ClarificationSessionSchema = createClarificationSessionSchema();

export const ClarificationSession =
  mongoose.models.ClarificationSession ||
  mongoose.model("ClarificationSession", ClarificationSessionSchema);

export { JourneyProgressSchema };
