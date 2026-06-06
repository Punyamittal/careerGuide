import mongoose from "mongoose";
import { createClarificationResponseSchema } from "../schemas/clarificationResponse.schema.js";

export const ClarificationResponseSchema = createClarificationResponseSchema();

export const ClarificationResponse =
  mongoose.models.ClarificationResponse ||
  mongoose.model("ClarificationResponse", ClarificationResponseSchema);
