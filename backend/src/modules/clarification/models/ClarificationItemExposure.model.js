import mongoose from "mongoose";
import { createClarificationItemExposureSchema } from "../schemas/clarificationItemExposure.schema.js";

export const ClarificationItemExposureSchema = createClarificationItemExposureSchema();

export const ClarificationItemExposure =
  mongoose.models.ClarificationItemExposure ||
  mongoose.model("ClarificationItemExposure", ClarificationItemExposureSchema);
