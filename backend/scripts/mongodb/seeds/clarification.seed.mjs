/**
 * Dev/pilot seed for User Flow 6 Phase 7.5 clarification collections.
 *
 * Usage:
 *   MONGODB_URI=... node scripts/mongodb/seeds/clarification.seed.mjs
 *   MONGODB_URI=... node scripts/mongodb/seeds/clarification.seed.mjs --user-id=<uuid>
 *   MONGODB_URI=... node scripts/mongodb/seeds/clarification.seed.mjs --wipe
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectMigrationDb, disconnectMigrationDb } from "../lib/connection.mjs";
import { COLLECTIONS } from "../../../src/modules/clarification/schemas/constants.js";
import {
  FLOW_STATUS,
  CLARIFICATION_STATUS
} from "../../../src/modules/clarification/constants/clarification.constants.js";

dotenv.config();

const SEED_TAG = "clarification-dev-seed-v1";

function parseArgs() {
  const userId =
    process.argv.find((a) => a.startsWith("--user-id="))?.split("=")[1] ??
    process.env.SEED_USER_ID ??
    "00000000-0000-4000-8000-clarificationseed";
  const wipe = process.argv.includes("--wipe");
  return { userId, wipe };
}

async function wipeSeedData(db, userId) {
  const flowCol = db.collection(COLLECTIONS.USER_FLOW_SESSIONS);
  const flows = await flowCol.find({ userId, "intakeMeta.role_target": SEED_TAG }).toArray();
  const flowIds = flows.map((f) => f._id);

  if (flowIds.length) {
    const clarCol = db.collection(COLLECTIONS.CLARIFICATION_SESSIONS);
    const clars = await clarCol.find({ flowSessionId: { $in: flowIds } }).toArray();
    const clarIds = clars.map((c) => c._id);

    if (clarIds.length) {
      await db.collection(COLLECTIONS.CLARIFICATION_RESPONSES).deleteMany({
        clarificationSessionId: { $in: clarIds }
      });
      await db.collection(COLLECTIONS.CLARIFICATION_SIM_RESULTS).deleteMany({
        clarificationSessionId: { $in: clarIds }
      });
      await clarCol.deleteMany({ _id: { $in: clarIds } });
    }

    await flowCol.deleteMany({ _id: { $in: flowIds } });
  }

  await db.collection(COLLECTIONS.CLARIFICATION_ITEM_EXPOSURE).deleteMany({
    userId,
    poolId: SEED_TAG
  });

  console.log(`Wiped prior seed data for userId=${userId}`);
}

async function seed() {
  const { userId, wipe } = parseArgs();
  await connectMigrationDb();
  const db = mongoose.connection.db;

  try {
    if (wipe) await wipeSeedData(db, userId);

    const now = new Date();

    const flowDoc = {
      userId,
      flowId: "user-6",
      status: FLOW_STATUS.CLARIFICATION,
      currentPhase: "7.5",
      phaseProgress: { "7": { completedAt: now } },
      constructSnapshot: {
        COMM: { score: 0.82, confidence: 0.55, methods: ["sjt"] },
        EQ: { score: 0.41, confidence: 0.52, methods: ["simulation"] },
        "NEG-SKILL": { score: 0.48, confidence: 0.58, methods: [] },
        TEAM: { score: 0.71, confidence: 0.88, methods: ["simulation"] },
        CONF: { score: 0.69, confidence: 0.85, methods: ["sjt"] }
      },
      validityFlags: {
        validity_band: "high",
        negt_likert_used_for_negotiation: false
      },
      telemetry: {
        team_chat_cooperation_score: 0.78,
        conflict_branch_style: "compete",
        wst_sjt_divergence_z: 1.2,
        neg_sim_telemetry_missing: true,
        in_tray_tau: 0.72,
        sim_completed_in_tray: true
      },
      accommodation: {
        extended_time: false,
        latency_penalty_disabled: false,
        time_multiplier: 1.0
      },
      intakeMeta: {
        role_target: SEED_TAG,
        region: "IN",
        declared_sector: "fintech",
        target_sector: "fintech",
        single_offer_flag: false
      },
      blockSessions: [],
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    const flowResult = await db.collection(COLLECTIONS.USER_FLOW_SESSIONS).insertOne(flowDoc);
    const flowSessionId = flowResult.insertedId;

    const journeyProgress = {
      J1: {
        status: "active",
        itemsAnswered: 1,
        itemsPlanned: { min: 6, max: 12 },
        simCompleted: false,
        recentItemIds: ["CLAR-J1-PROBE-001"]
      },
      "J2-NEG": {
        status: "pending",
        itemsAnswered: 0,
        itemsPlanned: { min: 4, max: 8 },
        simCompleted: false,
        recentItemIds: []
      }
    };

    const clarDoc = {
      flowSessionId,
      userId,
      status: CLARIFICATION_STATUS.IN_PROGRESS,
      firedRules: ["U1", "U12"],
      assignedJourneys: ["J1", "J2-NEG"],
      maxJourneys: 2,
      currentJourneyIndex: 0,
      journeyProgress,
      assignedJourneyMeta: [
        {
          journeyId: "J1",
          name: "Communication & EQ",
          priority: 2,
          forced: false,
          itemsPlanned: { min: 6, max: 12 },
          simInjection: ["SIM-READ-THE-ROOM"]
        },
        {
          journeyId: "J2-NEG",
          name: "Negotiation & Scope",
          priority: 2,
          forced: true,
          itemsPlanned: { min: 4, max: 8 },
          simInjection: ["SIM-NEGOTIATION-NPC-V2"]
        }
      ],
      accommodationSnapshot: { region: "IN", time_multiplier: 1.0 },
      fusionResult: null,
      blockedConstructs: [],
      evaluatedAt: now,
      finalizedAt: null,
      schemaVersion: 2,
      createdAt: now,
      updatedAt: now
    };

    const clarResult = await db.collection(COLLECTIONS.CLARIFICATION_SESSIONS).insertOne(clarDoc);
    const clarificationSessionId = clarResult.insertedId;

    await db.collection(COLLECTIONS.CLARIFICATION_RESPONSES).insertOne({
      clarificationSessionId,
      userId,
      journeyId: "J1",
      itemId: "CLAR-J1-PROBE-001",
      itemVersion: 2,
      questionType: "forced-choice",
      responseValue: { selectedOption: 1 },
      responseCorrect: true,
      partialScore: 1.0,
      responseTimeMs: 8420,
      answerChangeCount: 0,
      scoringRubric: "sjt_v2_rubric",
      clientSeq: 1,
      createdAt: now,
      updatedAt: now
    });

    await db.collection(COLLECTIONS.CLARIFICATION_ITEM_EXPOSURE).insertMany([
      {
        userId,
        itemId: "CLAR-J1-PROBE-001",
        exposureCount: 1,
        lastExposedAt: now,
        stemHash: "a1b2c3d4",
        journeyId: "J1",
        poolId: SEED_TAG,
        createdAt: now,
        updatedAt: now
      },
      {
        userId,
        itemId: "CLAR-J2-NEG-001",
        exposureCount: 2,
        lastExposedAt: now,
        stemHash: "e5f6g7h8",
        journeyId: "J2-NEG",
        poolId: SEED_TAG,
        createdAt: now,
        updatedAt: now
      }
    ]);

    console.log("Clarification seed inserted:");
    console.log(`  userId:                  ${userId}`);
    console.log(`  flowSessionId:           ${flowSessionId.toString()}`);
    console.log(`  clarificationSessionId:  ${clarificationSessionId.toString()}`);
    console.log(`  firedRules:              U1, U12`);
    console.log(`  tag (intakeMeta.role_target): ${SEED_TAG}`);
    console.log("\nAPI smoke test:");
    console.log(`  POST /api/v1/v6/session/${flowSessionId}/clarify/next`);
  } finally {
    await disconnectMigrationDb();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
