import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema(
  {
    round: Number,
    branch: String,
    tradePackage: String,
    scopePreserved: Number,
    datePreserved: Number,
    timestampMs: Number
  },
  { _id: false }
);

const NegotiationV2SessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    simId: { type: String, default: "SIM-NEGOTIATION-NPC-V2" },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    flowSessionId: { type: String, default: null },
    clarificationSessionId: { type: String, default: null },
    state: { type: mongoose.Schema.Types.Mixed, required: true },
    result: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true, collection: "negotiation_v2_sessions" }
);

NegotiationV2SessionSchema.index({ userId: 1, createdAt: -1 });

export const NegotiationV2Session =
  mongoose.models.NegotiationV2Session ||
  mongoose.model("NegotiationV2Session", NegotiationV2SessionSchema);
