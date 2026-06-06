#!/usr/bin/env node
/**
 * Compare assessment question counts: Concept Note / Intern Spec / archive / live app.
 * Usage: node backend/scripts/audit-assessment-counts.mjs
 */
import { getModuleContent } from "../src/services/assessmentBank.service.js";
import { resolveUserFlow, loadUserFlowSpec } from "../src/modules/assessment-bank/userFlowLoader.js";
import { getUserFlowBank } from "../src/modules/assessment-bank/loader.js";
import { isRenderableLikertItem } from "../src/modules/assessment-bank/likertAdapter.js";
import { USER_FLOW_SPECS } from "../src/modules/assessment-bank/userFlowConstants.js";
import { ARCHIVE_ROOT } from "../src/modules/assessment-bank/constants.js";

/** From MBS_6_User_Flows_Summary.md (Concept Note v2/v3 journey design) */
const CONCEPT_NOTE_TARGETS = {
  user1: { durationMin: 30, targetItems: 30, selectedBank: 21 },
  user2: { durationMin: 60, targetItems: 50, selectedBank: 44 },
  user3: { durationMin: 120, targetItems: 85, selectedBank: 54 },
  user4: { durationMin: 180, targetItems: 130, selectedBank: 117 },
  user5: { durationMin: 190, targetItems: 150, selectedBank: 169 },
  user6: { durationMin: 150, targetItems: 130, selectedBank: 122 }
};

/** Root MBS_UserFlow_User_6.json + Intern Flow Design Spec (ecosystem + clarification) */
const INTERN_EXTENDED = {
  durationMin: 165,
  targetItems: 157,
  selectedBank: 149
};

function auditFlow(key) {
  const flow = resolveUserFlow(key);
  const spec = loadUserFlowSpec(key).spec;
  const bank = getUserFlowBank(key);
  const blocks = flow.phases.flatMap((p) => p.blocks);

  const targetFromBlocks = blocks.reduce((s, b) => s + (b.targetCount ?? 0), 0);
  const itemIdsInFlow = blocks.reduce((s, b) => s + (b.itemIds?.length ?? 0), 0);
  const renderable = blocks.reduce((s, b) => s + (b.itemsRenderable ?? 0), 0);
  const missingRefs = blocks.reduce((s, b) => s + (b.missingIds?.length ?? 0), 0);

  const concept = CONCEPT_NOTE_TARGETS[key];

  return {
    key,
    label: flow.label,
    conceptNote: concept,
    flowJson: {
      targetItems: spec.target_items,
      selectedFromBank: spec._selected_item_count ?? null,
      durationMin: spec.duration_min
    },
    questionBank: {
      totalItems: bank?.items?.length ?? 0,
      renderableLikert: (bank?.items ?? []).filter(isRenderableLikertItem).length
    },
    flowOrchestration: {
      blockTargetSum: targetFromBlocks,
      itemIdsWired: itemIdsInFlow,
      renderableInWebApp: renderable,
      playableBlocks: flow.stats.playableBlocks,
      gameBlocks: flow.stats.gameBlocks,
      missingItemRefs: missingRefs
    },
    gaps: {
      vsConceptTarget: concept.targetItems - renderable,
      vsConceptSelected: concept.selectedBank - itemIdsInFlow,
      vsBlockTargets: targetFromBlocks - itemIdsInFlow,
      vsInternTarget: key === "user6" ? INTERN_EXTENDED.targetItems - renderable : null
    }
  };
}

console.log("=== MBS Assessment Count Audit ===\n");
console.log("Archive root:", ARCHIVE_ROOT);
console.log("\n--- User flows (Concept Note vs archive vs live web app) ---\n");

for (const key of Object.keys(USER_FLOW_SPECS)) {
  const row = auditFlow(key);
  console.log(`${row.label} (${row.key})`);
  console.log(
    `  Concept Note target:     ${row.conceptNote.targetItems} items · ${row.conceptNote.durationMin} min · bank slice ${row.conceptNote.selectedBank}`
  );
  if (key === "user6") {
    console.log(
      `  Intern spec (extended):  ${INTERN_EXTENDED.targetItems} items · ${INTERN_EXTENDED.durationMin} min · bank ${INTERN_EXTENDED.selectedBank}`
    );
  }
  console.log(
    `  Flow JSON (loaded):      target ${row.flowJson.targetItems} · selected ${row.flowJson.selectedFromBank} · ${row.flowJson.durationMin} min`
  );
  console.log(
    `  Question bank file:      ${row.questionBank.totalItems} items (${row.questionBank.renderableLikert} web-Likert-capable)`
  );
  console.log(
    `  Live user-flow runner:   ${row.flowOrchestration.itemIdsWired} IDs wired · ${row.flowOrchestration.renderableInWebApp} questions renderable · ${row.flowOrchestration.playableBlocks} playable blocks · ${row.flowOrchestration.gameBlocks} game blocks`
  );
  console.log(`  Block target sum:        ${row.flowOrchestration.blockTargetSum} (includes game/sim slots)`);
  if (row.flowOrchestration.missingItemRefs) {
    console.log(`  ⚠ Missing bank refs:     ${row.flowOrchestration.missingItemRefs}`);
  }
  console.log(
    `  Gap (Concept → web app): ${row.gaps.vsConceptTarget > 0 ? `−${row.gaps.vsConceptTarget} renderable` : `OK (${row.gaps.vsConceptTarget})`}`
  );
  if (row.gaps.vsInternTarget != null && row.gaps.vsInternTarget > 0) {
    console.log(`  Gap (Intern ext → web):  −${row.gaps.vsInternTarget} renderable`);
  }
  console.log("");
}

console.log("--- Standalone module assessments (/assessments/M1) ---\n");
for (const modId of ["M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "SS02", "SS03", "ECO01"]) {
  const c = getModuleContent(modId);
  console.log(`  ${modId}: ${c?.itemCount ?? 0} archive items (${c?.source ?? "?"})`);
}

console.log("\nNotes:");
console.log("• Concept 'target items' counts games/sims without static item_ids.");
console.log("• Web app today renders Likert/frequency/MCQ stems only — not full sim bank.");
console.log("• User 6 app loads root MBS_UserFlow_User_6.json (157 target) + 149-item bank.");
console.log("• Intern spec cites ~122 items in SJT blocks + runtime game content (~85% behavioural).");
