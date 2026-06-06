import mongoose from "mongoose";
import { VALIDITY_BANDS, CONFLICT_BRANCH_STYLES } from "./constants.js";
import { unitIntervalValidator } from "./validators.js";

export const ConstructEntrySchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0, ...unitIntervalValidator() },
    confidence: { type: Number, default: 0, ...unitIntervalValidator() },
    methods: { type: [String], default: [] },
    se: { type: Number, default: null, min: 0 }
  },
  { _id: false }
);

export const ValidityFlagsSchema = new mongoose.Schema(
  {
    validity_band: { type: String, enum: VALIDITY_BANDS, default: "high" },
    attention_fail: { type: Boolean, default: false },
    long_string_flag: { type: Boolean, default: false },
    honest_dice_overreport: { type: Number, default: 0, min: 0 },
    eco_d02_fake_familiarity: { type: Number, default: 0, min: 0, max: 5 },
    resume_skill_mismatch: { type: Number, default: 0, min: 0, max: 1 },
    resume_sector_mismatch: { type: Boolean, default: false },
    negt_likert_used_for_negotiation: { type: Boolean, default: false }
  },
  { _id: false }
);

export const FlowTelemetrySchema = new mongoose.Schema(
  {
    in_tray_tau: { type: Number, min: 0, max: 1 },
    in_tray_time_to_first_action_ms: { type: Number, min: 0 },
    trap_rank: { type: Number, min: 0 },
    two_doors_clues: { type: Number, min: 0 },
    two_doors_time_to_decide_s: { type: Number, min: 0 },
    crisis_commander_accuracy: { type: Number, ...unitIntervalValidator() },
    in_tray_stress_index: { type: Number, min: -1, max: 1 },
    team_chat_cooperation_score: { type: Number, ...unitIntervalValidator() },
    conflict_branch_style: { type: String, enum: CONFLICT_BRANCH_STYLES },
    format_lab_rule_change_gain: { type: Number, ...unitIntervalValidator() },
    lrn_primary_format_delta: { type: Number, ...unitIntervalValidator() },
    trend_radar_precision: { type: Number, ...unitIntervalValidator() },
    expert_challenge_accuracy: { type: Number, ...unitIntervalValidator() },
    eco_accuracy: { type: Number, ...unitIntervalValidator() },
    ent_signal: { type: Number, ...unitIntervalValidator() },
    job_signal: { type: Number, ...unitIntervalValidator() },
    trade_off_entropy: { type: Number, ...unitIntervalValidator() },
    path_branch_conf: { type: Number, ...unitIntervalValidator() },
    neg_sim_telemetry_missing: { type: Boolean, default: true },
    work_styles_arena_vector_conf: { type: Number, ...unitIntervalValidator() },
    wst_sjt_divergence_z: { type: Number, min: 0 },
    sim_completed_in_tray: { type: Boolean },
    in_tray_completed_primary: { type: Boolean }
  },
  { _id: false, strict: false }
);

export const AccommodationSchema = new mongoose.Schema(
  {
    extended_time: { type: Boolean, default: false },
    latency_penalty_disabled: { type: Boolean, default: false },
    time_multiplier: { type: Number, default: 1.0, min: 1, max: 3 },
    intake_accommodation_flag: { type: Boolean, default: false },
    latency_waiver_requested: { type: Boolean, default: false }
  },
  { _id: false }
);

export const IntakeMetaSchema = new mongoose.Schema(
  {
    role_target: { type: String, maxlength: 120 },
    region: { type: String, default: "IN", maxlength: 8 },
    declared_sector: { type: String, maxlength: 64 },
    target_sector: { type: String, maxlength: 64 },
    single_offer_flag: { type: Boolean, default: false }
  },
  { _id: false }
);

export const BlockSessionSchema = new mongoose.Schema(
  {
    phase: { type: String, required: true },
    blockKey: { type: String, required: true },
    assessmentSessionId: { type: String },
    completedAt: { type: Date }
  },
  { _id: false }
);

export const JourneyProgressSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["pending", "active", "completed"], default: "pending" },
    itemsAnswered: { type: Number, default: 0, min: 0 },
    itemsPlanned: {
      min: { type: Number, min: 1 },
      max: { type: Number, min: 1 }
    },
    simCompleted: { type: Boolean, default: false },
    simId: { type: String },
    recentItemIds: { type: [String], default: [] },
    constructConfidence: { type: Map, of: Number, default: () => new Map() },
    completedAt: { type: Date }
  },
  { _id: false }
);

export const ResponseValueSchema = new mongoose.Schema(
  {
    selectedOption: { type: mongoose.Schema.Types.Mixed },
    ranking: { type: [Number] },
    text: { type: String, maxlength: 2000 }
  },
  { _id: false, strict: false }
);
