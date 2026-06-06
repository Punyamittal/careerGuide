import {
  userFlowSessionIndexes
} from "../../../src/modules/clarification/schemas/userFlowSession.schema.js";
import {
  clarificationSessionIndexes
} from "../../../src/modules/clarification/schemas/clarificationSession.schema.js";
import {
  clarificationResponseIndexes
} from "../../../src/modules/clarification/schemas/clarificationResponse.schema.js";
import {
  clarificationSimResultIndexes
} from "../../../src/modules/clarification/schemas/clarificationSimResult.schema.js";
import {
  clarificationItemExposureIndexes
} from "../../../src/modules/clarification/schemas/clarificationItemExposure.schema.js";
import { COLLECTIONS } from "../../../src/modules/clarification/schemas/constants.js";
import {
  connectMigrationDb,
  disconnectMigrationDb,
  isMigrationApplied,
  recordMigration
} from "../lib/connection.mjs";

const MIGRATION_NAME = "002_clarification_indexes";

/** @type {Record<string, Array<{ key: object; options?: object }>>} */
const INDEX_MAP = {
  [COLLECTIONS.USER_FLOW_SESSIONS]: userFlowSessionIndexes,
  [COLLECTIONS.CLARIFICATION_SESSIONS]: clarificationSessionIndexes,
  [COLLECTIONS.CLARIFICATION_RESPONSES]: clarificationResponseIndexes,
  [COLLECTIONS.CLARIFICATION_SIM_RESULTS]: clarificationSimResultIndexes,
  [COLLECTIONS.CLARIFICATION_ITEM_EXPOSURE]: clarificationItemExposureIndexes
};

/**
 * @param {import("mongodb").Db} db
 */
export async function up(db) {
  for (const [collectionName, indexes] of Object.entries(INDEX_MAP)) {
    const col = db.collection(collectionName);
    for (const idx of indexes) {
      const name = idx.options?.name ?? Object.keys(idx.key).join("_");
      try {
        await col.createIndex(idx.key, { ...idx.options, name });
        console.log(`  index ${collectionName}.${name}`);
      } catch (err) {
        if (err?.code === 85 || err?.codeName === "IndexOptionsConflict") {
          console.log(`  skip (exists): ${collectionName}.${name}`);
        } else {
          throw err;
        }
      }
    }
  }
}

/**
 * @param {import("mongodb").Db} db
 */
export async function down(db) {
  for (const [collectionName, indexes] of Object.entries(INDEX_MAP)) {
    const col = db.collection(collectionName);
    for (const idx of indexes) {
      const name = idx.options?.name;
      if (name) {
        try {
          await col.dropIndex(name);
          console.log(`  dropped index ${collectionName}.${name}`);
        } catch {
          /* index may not exist */
        }
      }
    }
  }
}

async function main() {
  const action = process.argv[2] || "up";
  await connectMigrationDb();
  const db = (await import("mongoose")).default.connection.db;

  try {
    if (action === "down") {
      console.log(`Running ${MIGRATION_NAME} DOWN…`);
      await down(db);
    } else {
      const applied = await isMigrationApplied(db, MIGRATION_NAME);
      if (applied && !process.argv.includes("--force")) {
        console.log(`${MIGRATION_NAME} already applied — use --force to recreate indexes`);
        return;
      }
      console.log(`Running ${MIGRATION_NAME} UP…`);
      await up(db);
      await recordMigration(db, MIGRATION_NAME);
      console.log(`${MIGRATION_NAME} complete`);
    }
  } finally {
    await disconnectMigrationDb();
  }
}

const isDirect = process.argv[1]?.includes("002_clarification_indexes");
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { INDEX_MAP };
