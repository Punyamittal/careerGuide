#!/usr/bin/env node
/**
 * Verify MBS archive question banks + user flow orchestration specs.
 */
import { runVerification } from "../src/services/assessmentBank.service.js";
import { getModuleContent } from "../src/services/assessmentBank.service.js";
import { runUserFlowVerification } from "../src/services/assessmentBank.service.js";
import { PHASE1_MODULE_IDS } from "../src/constants/mbsModuleRegistry.js";

const report = runVerification();

console.log("=== MBS Assessment Bank Verification ===\n");
console.log("Version:", report.version);
console.log("Archive root:", report.archiveRoot);
console.log("\nBank item counts:", JSON.stringify(report.bankCounts, null, 2));
console.log("Global unique items (deduped):", report.globalUniqueItems);

const dupes = report.crossBankDuplicateIds ?? [];
if (dupes.length) {
  console.log(`\n⚠ Cross-bank duplicate item_ids (expected — deduped at load): ${dupes.length}`);
  console.log("  Sample:", dupes.slice(0, 10).join(", "));
}

for (const [bank, ids] of Object.entries(report.perBankDuplicateIds ?? {})) {
  if (ids.length) {
    console.error(`\n✗ Within-bank duplicates in ${bank}:`, ids.join(", "));
    process.exitCode = 1;
  }
}

console.log("\nModule coverage (archive items per module rule):");
for (const [mod, count] of Object.entries(report.moduleCoverage ?? {})) {
  const flag = count === 0 ? "⚠" : "✓";
  console.log(`  ${flag} ${mod}: ${count}`);
}

console.log("\nPhase-1 modules archive content:");
for (const modId of PHASE1_MODULE_IDS) {
  const content = getModuleContent(modId);
  const src = content?.source ?? "missing";
  const count = content?.itemCount ?? 0;
  const engine = content?.engineType ?? "?";
  console.log(`  ${modId}: ${count} items (${src}, engine=${engine})`);
}

if (report.warnings?.length) {
  console.log("\nWarnings:");
  for (const w of report.warnings) console.log(`  - ${w}`);
}

if (report.itemsMissingConstructsCount > 0) {
  console.log(
    `\nNote: ${report.itemsMissingConstructsCount} items lack constructs_fed (intake/survey blocks).`
  );
}

console.log("\nDone.");
if (process.exitCode) process.exit(process.exitCode);

console.log("\n=== MBS User Flow Verification ===\n");
for (const row of runUserFlowVerification()) {
  if (row.error) {
    console.error(`✗ ${row.key}: ${row.error}`);
    process.exitCode = 1;
    continue;
  }
  console.log(
    `  ${row.label ?? row.key}: ${row.phases} phases · ${row.stats.playableBlocks} playable · ${row.stats.gameBlocks} game · ${row.stats.missingItemRefs} missing refs`
  );
}
