/**
 * Post-fix QA validation harness — evidence-based checks (no browser).
 * Run: node backend/scripts/qa-post-fix-validation.mjs
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import {
  ASSESSMENT_KEYS,
  ASSESSMENT_PLANS,
  RIASEC_CODES,
  BIG_FIVE_CODES,
  MOTIVATION_CODES
} from "../src/constants/assessmentPlans.js";
import { hydrateQuestionCodes } from "../src/services/questionCodeHydration.js";
import { findAdaptiveProgress } from "../src/services/adaptive.service.js";
import { resolvePsychometricDataPath } from "../src/constants/psychometricDataDir.js";
import { buildLikertModuleConfig } from "../src/modules/assessment-bank/likertAdapter.js";
import { getUserFlowBlockContent, resolveUserFlow } from "../src/modules/assessment-bank/userFlowLoader.js";
import { USER_FLOW_SPECS } from "../src/modules/assessment-bank/userFlowConstants.js";
import { getModuleById } from "../src/constants/mbsModuleRegistry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const results = [];
const push = (area, test, status, evidence) => {
  results.push({ area, test, status, evidence });
};

function simulateAdaptiveRun(assessmentKey, byCode) {
  const plan = ASSESSMENT_PLANS[assessmentKey] ?? [];
  const responsesByQuestionId = new Map();
  let guard = 0;
  while (guard < plan.length + 10) {
    guard += 1;
    const progress = findAdaptiveProgress(assessmentKey, byCode, responsesByQuestionId);
    if (progress.error) {
      return {
        served: responsesByQuestionId.size,
        errors: [{ code: progress.missingCode, error: progress.error }],
        planLength: plan.length
      };
    }
    if (progress.done) {
      return { served: responsesByQuestionId.size, errors: [], planLength: plan.length };
    }
    const q = progress.nextQuestion;
    if (!q) break;
    const qid = String(q._id ?? q.id ?? q.externalCode);
    const payload = {
      questionId: qid,
      category: q.category,
      likertValue: q.useLikert ? 4 : undefined,
      selectedOptionKey: q.useLikert ? undefined : "B"
    };
    responsesByQuestionId.set(qid, payload);
  }
  return { served: responsesByQuestionId.size, errors: [], planLength: plan.length };
}

// --- Static / repo checks ---
const riasecPath = resolvePsychometricDataPath("psychometric-v2-riasec.json");
const bigFivePath = resolvePsychometricDataPath("psychometric-v2-big-five.json");
push(
  "Question Bank",
  "Psychometric JSON committed",
  existsSync(riasecPath) && existsSync(bigFivePath) ? "PASS" : "FAIL",
  `riasec=${existsSync(riasecPath)} bigFive=${existsSync(bigFivePath)}`
);

const riasecBank = JSON.parse(readFileSync(riasecPath, "utf8"));
push(
  "Question Bank",
  "RIA_R_03 in committed bank",
  riasecBank.some((r) => r.code === "RIA_R_03") ? "PASS" : "FAIL",
  `codes=${riasecBank.map((r) => r.code).join(",")}`
);

push(
  "Question Bank",
  "RIASEC_CODES includes RIA_R_03",
  RIASEC_CODES.includes("RIA_R_03") ? "PASS" : "FAIL",
  `count=${RIASEC_CODES.length}`
);

push(
  "Question Bank",
  "MOTIVATION_CODES lists MOT_01–MOT_28",
  MOTIVATION_CODES.length === 28 && MOTIVATION_CODES[27] === "MOT_28" ? "PASS" : "FAIL",
  `count=${MOTIVATION_CODES.length}`
);

// Hydration: no index drift when external_code present
const fakeRiasecRows = riasecBank.map((row, i) => ({
  id: `q-${i}`,
  externalCode: row.code,
  category: "riasec",
  stem: row.stem,
  options: []
}));
const hydrated = hydrateQuestionCodes("career_g11", fakeRiasecRows, {});
const riasecMissing = RIASEC_CODES.filter((c) => !hydrated[c]);
push(
  "Question Bank",
  "Hydration binds RIASEC by external_code (no index drift)",
  riasecMissing.length === 0 ? "PASS" : "FAIL",
  riasecMissing.length ? `missing=${riasecMissing.join(",")}` : "all bound"
);

// --- Supabase DB checks ---
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  push("DB", "Supabase connectivity", "BLOCKED", "SUPABASE_URL or SERVICE_ROLE_KEY unset");
} else {
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const allPlanCodes = [...new Set(Object.values(ASSESSMENT_PLANS).flat())];
  const { data: rows, error } = await supabase
    .from("questions")
    .select("id, external_code, category, stem, active")
    .eq("active", true);

  if (error) {
    push("DB", "Load questions", "FAIL", error.message);
  } else {
    const byCode = {};
    const dupes = [];
    for (const r of rows ?? []) {
      if (!r.external_code) continue;
      if (byCode[r.external_code]) dupes.push(r.external_code);
      else byCode[r.external_code] = r;
    }

    push(
      "DB",
      "Duplicate external_codes",
      dupes.length === 0 ? "PASS" : "FAIL",
      dupes.length ? `dupes=${[...new Set(dupes)].join(",")}` : `unique=${Object.keys(byCode).length}`
    );

    const motMissing = MOTIVATION_CODES.filter((c) => !byCode[c]);
    push(
      "DB",
      "MOT_01–MOT_28 in database",
      motMissing.length === 0 ? "PASS" : "FAIL",
      motMissing.length ? `missing=${motMissing.join(",")}` : "all 28 present"
    );

    push(
      "DB",
      "RIA_R_03 row in database",
      byCode.RIA_R_03 ? "PASS" : "FAIL",
      byCode.RIA_R_03 ? `stem=${String(byCode.RIA_R_03.stem).slice(0, 60)}…` : "not found"
    );

    const bfMissing = BIG_FIVE_CODES.filter((c) => !byCode[c]);
    push(
      "DB",
      "Big Five codes in database",
      bfMissing.length === 0 ? "PASS" : "FAIL",
      bfMissing.length ? `missing=${bfMissing.join(",")}` : `count=${BIG_FIVE_CODES.length}`
    );

    for (const track of ASSESSMENT_KEYS) {
      const plan = ASSESSMENT_PLANS[track] ?? [];
      const shaped = (rows ?? [])
        .filter((r) => r.external_code && plan.includes(r.external_code))
        .map((r) => ({
          id: r.id,
          externalCode: r.external_code,
          category: r.category,
          stem: r.stem,
          options: []
        }));
      const merged = hydrateQuestionCodes(track, shaped, {});
      const missing = plan.filter((c) => !merged[c]);
      const sim = simulateAdaptiveRun(track, merged);

      push(
        "Assessment",
        `${track} plan coverage`,
        missing.length === 0 ? "PASS" : "FAIL",
        missing.length ? `missing=${missing.length} sample=${missing.slice(0, 5).join(",")}` : `${plan.length} codes`
      );

      push(
        "Assessment",
        `${track} adaptive simulation (no missing_question_code)`,
        sim.errors.length === 0 ? "PASS" : "FAIL",
        sim.errors.length
          ? JSON.stringify(sim.errors[0])
          : `served=${sim.served.length}/${sim.planLength}`
      );
    }
  }

  // Clarification tables
  const { error: ufsErr } = await supabase.from("user_flow_sessions").select("id").limit(1);
  push(
    "Clarification",
    "user_flow_sessions table exists",
    !ufsErr ? "PASS" : "FAIL",
    ufsErr?.message ?? "ok"
  );
}

// --- User flows 1–5 (skip 6) ---
const ufKeys = Object.keys(USER_FLOW_SPECS).filter((k) => k !== "user6");
for (const key of ufKeys) {
  const flow = resolveUserFlow(key);
  if (!flow) {
    push("User Flow", `${key} loads`, "FAIL", "resolveUserFlow returned null");
    continue;
  }
  const playable = flow.stats.playableBlocks;
  const missingRefs = flow.stats.missingItemRefs;
  let emptyBlocks = 0;
  let totalItems = 0;
  for (const phase of flow.phases) {
    for (const block of phase.blocks) {
      if (!block.playable) continue;
      const content = getUserFlowBlockContent(key, phase.phaseIndex, block.blockIndex);
      const items = content?.config?.items ?? [];
      totalItems += items.length;
      if (!items.length || items.every((i) => !i.prompt?.trim())) emptyBlocks += 1;
    }
  }
  push(
    "User Flow",
    `${flow.label} (${key})`,
    emptyBlocks === 0 && missingRefs === 0 ? "PASS" : "PARTIAL",
    `playable=${playable} items=${totalItems} emptyBlocks=${emptyBlocks} missingRefs=${missingRefs}`
  );
}

// --- MBS modules ---
const moduleIds = [
  "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09",
  "SS02", "SS03", "P01", "I01", "ECO01"
];
for (const mid of moduleIds) {
  const cfg = buildLikertModuleConfig(mid);
  const mod = getModuleById(mid);
  if (!cfg) {
    push("MBS", `${mid} config`, "PARTIAL", `no archive config (engine=${mod?.engineType ?? "?"})`);
    continue;
  }
  const empty = cfg.items.filter((i) => !i.prompt?.trim()).length;
  push(
    "MBS",
    `${mid} prompts`,
    empty === 0 ? "PASS" : "FAIL",
    `items=${cfg.items.length} emptyPrompts=${empty}`
  );
}

// --- API smoke (optional local server) ---
const port = process.env.PORT || 5000;
const base = `http://127.0.0.1:${port}/api/v1`;
try {
  const t0 = Date.now();
  const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) });
  const healthMs = Date.now() - t0;
  push(
    "API",
    "Health endpoint",
    health.ok ? "PASS" : "FAIL",
    `status=${health.status} latency=${healthMs}ms`
  );

  const t1 = Date.now();
  const neg = await fetch(`${base}/simulations/negotiation-v2/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(15000)
  });
  const negMs = Date.now() - t1;
  push(
    "Negotiation V2",
    "POST /sessions without auth",
    neg.status === 401 ? "PASS" : "PARTIAL",
    `status=${neg.status} latency=${negMs}ms (expect 401)`
  );

  const t2 = Date.now();
  const clar = await fetch(`${base}/v6/flows/user-6/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(10000)
  });
  const clarMs = Date.now() - t2;
  push(
    "Clarification",
    "POST /v6/flows/user-6/sessions without auth",
    clar.status === 401 ? "PASS" : clar.status === 502 ? "FAIL" : "PARTIAL",
    `status=${clar.status} latency=${clarMs}ms`
  );
} catch (e) {
  push("API", "Local backend smoke", "BLOCKED", String(e.message || e));
}

// --- Games catalog ---
const careerData = readFileSync(join(__dirname, "../../frontend/lib/career-data.ts"), "utf8");
const gameIds = [...careerData.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
const unique = new Set(gameIds);
push(
  "Games",
  "8 games defined",
  gameIds.length === 8 ? "PASS" : "PARTIAL",
  `count=${gameIds.length} unique=${unique.size}`
);

// Output report
const pass = results.filter((r) => r.status === "PASS").length;
const fail = results.filter((r) => r.status === "FAIL").length;
const partial = results.filter((r) => r.status === "PARTIAL").length;
const blocked = results.filter((r) => r.status === "BLOCKED").length;
const total = results.length;
const passPct = Math.round((pass / total) * 100);

console.log("\n=== CareerGUIDE Post-Fix QA Validation ===\n");
console.log(`Checks: ${total} | PASS ${pass} (${passPct}%) | FAIL ${fail} | PARTIAL ${partial} | BLOCKED ${blocked}\n`);

for (const r of results) {
  const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : r.status === "BLOCKED" ? "○" : "~";
  console.log(`${icon} [${r.area}] ${r.test}: ${r.status}`);
  console.log(`    ${r.evidence}`);
}

console.log("\n--- JSON ---");
console.log(JSON.stringify({ summary: { total, pass, fail, partial, blocked, passPct }, results }, null, 2));

process.exit(fail > 0 ? 1 : 0);
