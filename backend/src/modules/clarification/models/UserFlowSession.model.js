import mongoose from "mongoose";
import { createUserFlowSessionSchema } from "../schemas/userFlowSession.schema.js";

export const UserFlowSessionSchema = createUserFlowSessionSchema();

export const UserFlowSession =
  mongoose.models.UserFlowSession || mongoose.model("UserFlowSession", UserFlowSessionSchema);
