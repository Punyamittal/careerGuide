import {
  collectionValidators,
  allCollectionNames
} from "../schema/clarification.validators.mjs";
import {
  connectMigrationDb,
  disconnectMigrationDb,
  isMigrationApplied,
  recordMigration
} from "../lib/connection.mjs";

const MIGRATION_NAME = "001_clarification_collections";

/**
 * Create clarification collections with JSON Schema validators.
 * Idempotent: safe to re-run (creates missing collections, updates validators).
 */
export async function up(db) {
  for (const name of allCollectionNames) {
    const exists = await db.listCollections({ name }).hasNext();
    const validator = collectionValidators[name];

    if (!exists) {
      await db.createCollection(name, {
        validator,
        validationLevel: "moderate",
        validationAction: "error"
      });
      console.log(`  created collection: ${name}`);
    } else {
      await db.command({
        collMod: name,
        validator,
        validationLevel: "moderate",
        validationAction: "error"
      });
      console.log(`  updated validator: ${name}`);
    }
  }

  await db.collection("schema_migrations").createIndex({ name: 1 }, { unique: true });
}

export async function down(db) {
  for (const name of [...allCollectionNames].reverse()) {
    const exists = await db.listCollections({ name }).hasNext();
    if (exists) {
      await db.collection(name).drop();
      console.log(`  dropped collection: ${name}`);
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
      if (applied && process.argv.includes("--force")) {
        console.log(`Re-applying ${MIGRATION_NAME} (--force)…`);
      } else if (applied) {
        console.log(`${MIGRATION_NAME} already applied — use --force to re-apply validators`);
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

const isDirect = process.argv[1]?.includes("001_clarification_collections");
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
