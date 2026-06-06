import { readdir } from "fs/promises";
import { join } from "path";
import {
  connectMigrationDb,
  disconnectMigrationDb,
  isMigrationApplied,
  migrationsDir
} from "../lib/connection.mjs";

/**
 * Run all pending clarification MongoDB migrations in order.
 *
 * Usage:
 *   node scripts/mongodb/migrations/run.mjs
 *   node scripts/mongodb/migrations/run.mjs --force
 *   node scripts/mongodb/migrations/run.mjs down
 */
async function main() {
  const action = process.argv.includes("down") ? "down" : "up";
  const force = process.argv.includes("--force");

  await connectMigrationDb();
  const mongoose = (await import("mongoose")).default;
  const db = mongoose.connection.db;

  const dir = migrationsDir();
  const files = (await readdir(dir))
    .filter((f) => /^\d{3}_.+\.mjs$/.test(f))
    .sort();

  try {
    for (const file of files) {
      const mod = await import(join(dir, file));
      const name = file.replace(/\.mjs$/, "");

      if (action === "down") {
        if (typeof mod.down === "function") {
          console.log(`\n↓ ${name}`);
          await mod.down(db);
        }
        continue;
      }

      const applied = await isMigrationApplied(db, name);
      if (applied && !force) {
        console.log(`✓ ${name} (skipped — already applied)`);
        continue;
      }

      console.log(`\n↑ ${name}${force && applied ? " (force)" : ""}`);
      if (typeof mod.up === "function") {
        await mod.up(db);
      } else {
        await import(join(dir, file));
      }

      const { recordMigration } = await import("../lib/connection.mjs");
      await recordMigration(db, name);
      console.log(`✓ ${name} applied`);
    }

    console.log("\nAll migrations processed.");
  } finally {
    await disconnectMigrationDb();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
