/**
 * Sync assessment_modules registry (MBS + user-flow block IDs) to Supabase.
 * Run: node backend/scripts/seed-assessment-modules.mjs
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { MBS_MODULE_REGISTRY } from "../src/constants/mbsModuleRegistry.js";
import { USER_FLOW_SPECS } from "../src/modules/assessment-bank/userFlowConstants.js";
import { resolveUserFlow } from "../src/modules/assessment-bank/userFlowLoader.js";

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function registryRow(mod) {
  return {
    id: mod.id,
    product_code: mod.productCode,
    title: mod.title,
    description: mod.title,
    engine_type: mod.engineType,
    toolkit_ref: mod.toolkitRef,
    construct_tags: mod.constructTags ?? [],
    mbs_domain_hints: mod.mbsDomainHints ?? [],
    difficulty_tier: mod.difficultyTier ?? "beginner",
    estimated_minutes: mod.estimatedMinutes ?? 5,
    status: mod.status ?? "beta",
    sort_order: mod.sortOrder ?? 0,
    config: {}
  };
}

function flowBlockRow(block, userFlowKey) {
  return {
    id: block.moduleId,
    product_code: block.moduleId,
    title: `${userFlowKey} ${block.phase ?? ""} block ${block.blockIndex}`,
    description: `User flow block ${block.moduleId}`,
    engine_type: "likert",
    toolkit_ref: null,
    construct_tags: ["USER_FLOW"],
    mbs_domain_hints: [],
    difficulty_tier: "beginner",
    estimated_minutes: 5,
    status: "beta",
    sort_order: 900 + block.blockIndex,
    config: { userFlowKey, deliveryType: block.deliveryType }
  };
}

async function run() {
  const rows = MBS_MODULE_REGISTRY.map(registryRow);
  const seen = new Set(rows.map((r) => r.id));

  for (const spec of Object.values(USER_FLOW_SPECS)) {
    if (spec.key === "user6") continue;
    const flow = resolveUserFlow(spec.key);
    if (!flow) continue;
    for (const phase of flow.phases ?? []) {
      for (const block of phase.blocks ?? []) {
        if (!block.moduleId || seen.has(block.moduleId)) continue;
        seen.add(block.moduleId);
        rows.push(flowBlockRow(block, spec.key));
      }
    }
  }

  const { error } = await supabase.from("assessment_modules").upsert(rows, { onConflict: "id" });
  if (error) throw error;

  console.log(`Synced ${rows.length} assessment_modules rows (${rows.length - MBS_MODULE_REGISTRY.length} user-flow blocks).`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
