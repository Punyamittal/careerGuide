import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { generateWithXAI } from "./ai.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../../../frontend/data");

const TRACK_MAP = {
  early_g5: { label: "Grade 5", total: 15 },
  middle_g8: { label: "Grade 8", total: 16 },
  stream_g910: { label: "Grades 9-10", total: 18 },
  career_g11: { label: "Grades 11-12 & undergrad", total: 20 }
};

const LIKERT_OPTIONS = [
  { key: "1", text: "Strongly disagree" },
  { key: "2", text: "Disagree" },
  { key: "3", text: "Neutral" },
  { key: "4", text: "Agree" },
  { key: "5", text: "Strongly agree" }
];

function safeReadJson(fileName, fallback = []) {
  try {
    return JSON.parse(readFileSync(join(dataDir, fileName), "utf8"));
  } catch {
    return fallback;
  }
}

const bigFiveV2 = safeReadJson("psychometric-v2-big-five.json");
const riasecV2 = safeReadJson("psychometric-v2-riasec.json");
const ipip50 = safeReadJson("ipip-50.json");
const riasec48 = safeReadJson("riasec-48.json");

const QUESTION_POOL = [
  ...bigFiveV2.map((q) => ({
    code: q.code,
    source: "psychometric-v2-big-five",
    domain: "big5",
    axis: q.bigFiveKey,
    stem: q.stem,
    options: LIKERT_OPTIONS
  })),
  ...riasecV2.map((q) => ({
    code: q.code,
    source: "psychometric-v2-riasec",
    domain: "riasec",
    axis: q.riasecKey,
    stem: q.stem,
    options: LIKERT_OPTIONS
  })),
  ...ipip50.map((q) => ({
    code: q.code,
    source: "ipip-50",
    domain: "big5",
    axis: q.bigFiveKey,
    stem: q.stem,
    options: LIKERT_OPTIONS
  })),
  ...riasec48.map((q) => ({
    code: q.code,
    source: "riasec-48",
    domain: "riasec",
    axis: q.riasecKey,
    stem: `I would enjoy: ${q.stem}.`,
    options: LIKERT_OPTIONS
  }))
];

function normalizeTrack(track) {
  return TRACK_MAP[track] ? track : "career_g11";
}

function summarizeHistory(history) {
  const axisScores = {};
  for (const h of history) {
    const axis = String(h?.axis || "").trim();
    const score = Number(h?.likertValue);
    if (!axis || Number.isNaN(score)) continue;
    if (!axisScores[axis]) axisScores[axis] = { total: 0, count: 0 };
    axisScores[axis].total += score;
    axisScores[axis].count += 1;
  }
  const averaged = Object.entries(axisScores).map(([axis, v]) => ({
    axis,
    avg: Number((v.total / v.count).toFixed(2)),
    count: v.count
  }));
  averaged.sort((a, b) => b.avg - a.avg);
  return averaged;
}

function deterministicNext(candidates, historySummary) {
  if (!candidates.length) return null;
  const weakAxis = [...historySummary].sort((a, b) => a.avg - b.avg)[0]?.axis;
  if (weakAxis) {
    const preferred = candidates.find((c) => c.axis === weakAxis);
    if (preferred) return preferred;
  }
  return candidates[0];
}

function trimForModel(candidates) {
  return candidates.slice(0, 20).map((c) => ({
    code: c.code,
    source: c.source,
    domain: c.domain,
    axis: c.axis,
    stem: c.stem
  }));
}

export async function getAdaptiveCareerQuizStep({
  track,
  history,
  targetQuestions
}) {
  const normalizedTrack = normalizeTrack(track);
  const trackConfig = TRACK_MAP[normalizedTrack];
  const targetTotal = Math.min(20, Math.max(15, Number(targetQuestions) || trackConfig.total));
  const askedCodes = new Set(history.map((h) => String(h.code || "")));
  const candidates = QUESTION_POOL.filter((q) => !askedCodes.has(q.code));
  const answeredCount = history.length;

  if (answeredCount >= targetTotal || !candidates.length) {
    return {
      done: true,
      progress: { answered: answeredCount, total: targetTotal },
      track: normalizedTrack,
      trackLabel: trackConfig.label
    };
  }

  const summary = summarizeHistory(history);
  const modelCandidates = trimForModel(candidates);
  let picked = null;
  let provider = "fallback";

  try {
    const grokPrompt = `You are selecting the next adaptive career-guidance quiz question.
Rules:
- Use ONLY one question code from candidates.
- Prioritize information gain based on previous answers.
- Keep difficulty and language age-appropriate for ${trackConfig.label}.
- Return JSON only.

State:
${JSON.stringify({ track: normalizedTrack, targetTotal, answeredCount, summary }, null, 2)}

Candidates:
${JSON.stringify(modelCandidates, null, 2)}

Output JSON schema:
{"code":"candidate_code","why":"short reason <= 20 words","stem":"question text","axis":"axis","domain":"big5|riasec","source":"dataset_name"}`;

    const { text } = await generateWithXAI(grokPrompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    picked = candidates.find((c) => c.code === parsed.code) || null;
    if (picked) {
      picked = {
        ...picked,
        stem: String(parsed.stem || picked.stem).slice(0, 280)
      };
      provider = "grok";
    }
  } catch {
    picked = null;
  }

  if (!picked) {
    picked = deterministicNext(candidates, summary);
  }

  return {
    done: false,
    progress: { answered: answeredCount, total: targetTotal },
    track: normalizedTrack,
    trackLabel: trackConfig.label,
    provider,
    nextQuestion: {
      code: picked.code,
      source: picked.source,
      domain: picked.domain,
      axis: picked.axis,
      stem: picked.stem,
      responseType: "likert",
      options: picked.options
    }
  };
}
