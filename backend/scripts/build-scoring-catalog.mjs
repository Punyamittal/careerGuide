/**
 * Extracts Likert item scoring rules from frontend TS configs into catalog.json.
 * Run: node scripts/build-scoring-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const configDir = path.join(root, "frontend/lib/assessment-engine/configs");
const outPath = path.join(__dirname, "../src/constants/scoring/catalog.json");

const LIKERT_FILES = [
  { file: "M1.config.ts", moduleId: "M01" },
  { file: "M2.config.ts", moduleId: "M02" },
  { file: "M3.config.ts", moduleId: "M03" },
  { file: "M4.config.ts", moduleId: "M04" },
  { file: "M5.config.ts", moduleId: "M05" },
  { file: "M6.config.ts", moduleId: "M06" },
  { file: "M7.config.ts", moduleId: "M07" },
  { file: "M8.config.ts", moduleId: "M08" },
  { file: "M9.config.ts", moduleId: "M09" }
];

const BRANCHING = [
  { file: "M11.config.ts", moduleId: "SS02", constructs: ["COMMUNICATION", "SOCIAL_SKILLS", "EMPATHY"] },
  { file: "M12.config.ts", moduleId: "SS03", constructs: ["COLLABORATION", "SOCIAL_SKILLS", "TEAMWORK"] }
];

function parseConstructs(text) {
  const m = text.match(/constructs:\s*\[([^\]]+)\]/);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.replace(/['"]/g, "").trim())
    .filter(Boolean);
}

function parseLikertItems(text) {
  const items = [];
  const itemBlocks = text.matchAll(
    /\{\s*id:\s*"([^"]+)"[\s\S]*?type:\s*"([^"]+)"[\s\S]*?scoringWeight:\s*\{([^}]+)\}([\s\S]*?idealIndex:\s*(\d+))?/g
  );
  for (const block of itemBlocks) {
    const id = block[1];
    const type = block[2];
    const weightStr = block[3];
    const idealIndex = block[5] ? Number(block[5]) : undefined;
    const reverseMatch = block[0].match(/reverse:\s*true/);
    const scoringWeight = {};
    for (const part of weightStr.split(",")) {
      const wm = part.match(/(\w+):\s*([\d.]+)/);
      if (wm) scoringWeight[wm[1]] = Number(wm[2]);
    }
    const item = { id, type, scoringWeight };
    if (idealIndex != null) item.idealIndex = idealIndex;
    if (reverseMatch) item.reverse = true;
    items.push(item);
  }
  return items;
}

const catalog = { version: 1, modules: {} };

for (const { file, moduleId } of LIKERT_FILES) {
  const text = fs.readFileSync(path.join(configDir, file), "utf8");
  const constructs = parseConstructs(text);
  catalog.modules[moduleId] = {
    engineType: "likert",
    constructs,
    items: parseLikertItems(text)
  };
}

for (const { file, moduleId, constructs } of BRANCHING) {
  catalog.modules[moduleId] = {
    engineType: "branching",
    constructs,
    signalToConstruct: {
      empathy: { EMPATHY: 0.5, COMMUNICATION: 0.35, COLLABORATION: 0.25 },
      communication: { COMMUNICATION: 0.55, COLLABORATION: 0.35 },
      assertiveness: { COMMUNICATION: 0.25, COLLABORATION: 0.2 },
      escalation: { COMMUNICATION: -0.15, COLLABORATION: -0.1 }
    }
  };
}

catalog.modules.T4 = {
  engineType: "tracing",
  constructs: ["COORDINATION"],
  metrics: { pathAccuracy: 0.6, completionSpeed: 0.25, consistency: 0.15 }
};

catalog.modules.T5 = {
  engineType: "reaction_time",
  constructs: ["ATTENTION"],
  metrics: { accuracy: 0.55, inhibition: 0.3, meanRt: 0.15 }
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2));
console.log(`Wrote ${outPath} (${Object.keys(catalog.modules).length} modules)`);
