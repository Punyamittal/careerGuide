/**
 * Assert every external_code referenced in ASSESSMENT_PLANS is present in seed output.
 * Run: node backend/scripts/verify-seed-coverage.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import {
  ASSESSMENT_KEYS,
  ASSESSMENT_PLANS
} from "../src/constants/assessmentPlans.js";
import { resolvePsychometricDataPath } from "../src/constants/psychometricDataDir.js";

dotenv.config();

const bigFiveBank = JSON.parse(
  readFileSync(resolvePsychometricDataPath("psychometric-v2-big-five.json"), "utf8")
);
const riasecBank = JSON.parse(
  readFileSync(resolvePsychometricDataPath("psychometric-v2-riasec.json"), "utf8")
);

/** Codes produced by seed.mjs (aptitude + psychometric banks + MOT_* + WRI_*). */
const SEED_STATIC_CODES = new Set([
  "APT_L_1",
  "APT_L_2",
  "APT_L_3",
  "APT_L_4",
  "APT_N_1",
  "APT_N_2",
  "APT_N_3",
  "APT_N_4",
  "APT_V_1",
  "APT_V_2",
  "APT_V_3",
  "APT_V_4",
  ...bigFiveBank.map((r) => r.code),
  ...riasecBank.map((r) => r.code),
  ...Array.from({ length: 28 }, (_, i) => `MOT_${String(i + 1).padStart(2, "0")}`),
  "WRI_1"
]);

let failed = false;

for (const key of ASSESSMENT_KEYS) {
  const plan = ASSESSMENT_PLANS[key] ?? [];
  const missingFromSeed = plan.filter((code) => !SEED_STATIC_CODES.has(code));
  if (missingFromSeed.length) {
    failed = true;
    console.error(`[verify-seed] ${key}: ${missingFromSeed.length} codes not in seed sources`);
    console.error(`  sample: ${missingFromSeed.slice(0, 10).join(", ")}`);
  } else {
    console.log(`[verify-seed] ${key}: OK (${plan.length} codes)`);
  }
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (url && serviceKey) {
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const allCodes = [...new Set(Object.values(ASSESSMENT_PLANS).flat())];
  const { data, error } = await supabase
    .from("questions")
    .select("external_code")
    .eq("active", true)
    .in("external_code", allCodes);

  if (error) {
    console.warn(`[verify-seed] DB check skipped: ${error.message}`);
  } else {
    const inDb = new Set((data ?? []).map((r) => r.external_code).filter(Boolean));
    for (const key of ASSESSMENT_KEYS) {
      const plan = ASSESSMENT_PLANS[key] ?? [];
      const missing = plan.filter((code) => !inDb.has(code));
      if (missing.length) {
        failed = true;
        console.error(`[verify-seed] DB ${key}: missing ${missing.length} codes — re-run seed.mjs`);
        console.error(`  sample: ${missing.slice(0, 10).join(", ")}`);
      } else {
        console.log(`[verify-seed] DB ${key}: OK`);
      }
    }
  }
} else {
  console.warn("[verify-seed] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — static check only");
}

if (failed) {
  process.exit(1);
}

console.log("[verify-seed] All assessment plans covered.");
