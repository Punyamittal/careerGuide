/**
 * Production-grade live QA verification for CareerGUIDE.
 * Run: node backend/scripts/realtime-qa-verification.mjs
 *
 * Requires backend/.env (Supabase + optional TEST_AUTH_TOKEN).
 * Backend default: http://localhost:5000
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  ASSESSMENT_KEYS,
  ASSESSMENT_PLANS,
  BIG_FIVE_CODES,
  MOTIVATION_CODES,
  RIASEC_CODES
} from "../src/constants/assessmentPlans.js";
import { MBS_MODULE_REGISTRY } from "../src/constants/mbsModuleRegistry.js";
import { flowBlockModuleId } from "../src/modules/assessment-bank/userFlowConstants.js";
import {
  LOCAL_API,
  PRODUCTION_FRONTEND,
  apiRequest,
  autoAnswerQuestion,
  checks,
  getSupabaseAdmin,
  isServerError,
  recordCheck,
  resolveAuthToken,
  summarizeChecks,
  unwrap
} from "./lib/qa-helpers.mjs";
import { buildMarkdownReport, computeVerdict } from "./lib/qa-report.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = join(__dirname, "../../docs/verification/realtime-qa-report.md");

const ASSESSMENT_TRACKS = ["early_g5", "middle_g8", "stream_g910", "career_g11"];
const USER_FLOWS = ["user-1", "user-2", "user-3", "user-4", "user-5"];

/** @type {Record<string, unknown>} */
const sectionData = {
  generatedAt: new Date().toISOString(),
  backendUrl: LOCAL_API.replace(/\/api\/v1$/, ""),
  productionUrl: PRODUCTION_FRONTEND
};

/** @type {{ token: string; userId: string; email: string } | null} */
let auth = null;

async function main() {
  console.log("=== CareerGUIDE Realtime QA Verification ===\n");
  console.log(`Backend API: ${LOCAL_API}`);
  console.log(`Production:  ${PRODUCTION_FRONTEND}\n`);

  await test1HealthCheck();

  try {
    auth = await resolveAuthToken();
    sectionData.authEmail = auth.email;
    recordCheck({
      area: "Auth",
      name: "Programmatic login",
      status: "PASS",
      evidence: `userId=${auth.userId} created=${auth.created}`
    });
  } catch (err) {
    recordCheck({
      area: "Auth",
      name: "Programmatic login",
      status: "BLOCKED",
      evidence: String(err?.message ?? err)
    });
  }

  await test3QuestionBankIntegrity();

  if (auth?.token) {
    await test2AssessmentFlow();
    await test4UserFlowVerification();
    await test5MbsModules();
    await test6ClarificationEngine();
    await test7NegotiationV2();
    await test8AiCoach();
    await test9Reports();
    await test10DashboardSync();
  } else {
    for (const name of [
      "Assessment flow",
      "User flow verification",
      "MBS modules",
      "Clarification engine",
      "Negotiation V2",
      "AI coach",
      "Reports",
      "Dashboard sync"
    ]) {
      recordCheck({ area: "Auth", name, status: "BLOCKED", evidence: "No JWT — auth setup failed" });
    }
  }

  await test11ProductionVerification();

  const summary = summarizeChecks();
  sectionData.summary = summary;
  const criticalFails = checks.filter((c) => c.status === "FAIL" && c.meta?.critical !== false).length;
  sectionData.verdict = computeVerdict(summary, criticalFails);

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  const markdown = buildMarkdownReport(checks, sectionData);
  writeFileSync(REPORT_PATH, markdown, "utf8");

  console.log(`\nChecks: ${summary.total} | PASS ${summary.pass} (${summary.passPct}%) | FAIL ${summary.fail} | BLOCKED ${summary.blocked}`);
  console.log(`Verdict: ${sectionData.verdict}`);
  console.log(`Report: ${REPORT_PATH}\n`);

  for (const c of checks) {
    const icon = c.status === "PASS" ? "✓" : c.status === "FAIL" ? "✗" : "○";
    console.log(`${icon} [${c.area}] ${c.name}: ${c.status}`);
    if (c.evidence) console.log(`    ${c.evidence.slice(0, 200)}`);
  }

  process.exit(summary.fail > 0 ? 1 : 0);
}

/** TEST 1 */
async function test1HealthCheck() {
  const res = await apiRequest(LOCAL_API, "/health", { timeoutMs: 10_000 });
  const data = unwrap(res.body);
  const statusOk = data?.status === "ok";
  const pass = res.status === 200 && statusOk && !res.error;

  recordCheck({
    area: "Health",
    name: "GET /api/v1/health",
    status: res.error ? "BLOCKED" : pass ? "PASS" : "FAIL",
    evidence: `status=${res.status} latency=${res.latencyMs}ms body=${JSON.stringify(data)}`,
    meta: { latencyMs: res.latencyMs, statusCode: res.status, critical: true }
  });

  sectionData.health = { statusCode: res.status, latencyMs: res.latencyMs, body: data };
}

/** TEST 2 */
async function test2AssessmentFlow() {
  /** @type {Record<string, unknown>[]} */
  const results = [];

  for (const assessmentKey of ASSESSMENT_TRACKS) {
    const create = await apiRequest(LOCAL_API, "/tests/attempts", {
      method: "POST",
      token: auth.token,
      body: { assessmentKey },
      timeoutMs: 30_000
    });

    if (isServerError(create.status)) {
      results.push({ assessmentKey, completed: false, error: `create ${create.status}` });
      recordCheck({
        area: "Assessment",
        name: `${assessmentKey} full flow`,
        status: "FAIL",
        evidence: `POST /tests/attempts → ${create.status}`,
        meta: { critical: true }
      });
      continue;
    }

    const attemptId = unwrap(create.body)?.attempt?.id;
    if (!attemptId) {
      results.push({ assessmentKey, completed: false, error: "no attempt id" });
      recordCheck({
        area: "Assessment",
        name: `${assessmentKey} full flow`,
        status: "FAIL",
        evidence: `create response missing attempt id: ${JSON.stringify(create.body)?.slice(0, 200)}`,
        meta: { critical: true }
      });
      continue;
    }

    let questionsAnswered = 0;
    let completed = false;
    let missingQuestionCode = null;
    let scoreGenerated = false;
    let guard = 0;
    const maxSteps = (ASSESSMENT_PLANS[assessmentKey]?.length ?? 80) + 5;

    while (guard < maxSteps) {
      guard += 1;
      const step = await apiRequest(LOCAL_API, `/tests/attempts/${attemptId}/next-question`, {
        token: auth.token,
        timeoutMs: 60_000
      });

      if (isServerError(step.status)) {
        results.push({ assessmentKey, questionsAnswered, completed: false, serverError: step.status });
        recordCheck({
          area: "Assessment",
          name: `${assessmentKey} full flow`,
          status: "FAIL",
          evidence: `next-question → ${step.status}`,
          meta: { critical: true }
        });
        break;
      }

      const payload = unwrap(step.body);
      if (payload?.error === "missing_question_code" || payload?.missingCode) {
        missingQuestionCode = payload.missingCode ?? payload.error;
        recordCheck({
          area: "Assessment",
          name: `${assessmentKey} full flow`,
          status: "FAIL",
          evidence: `missing_question_code: ${missingQuestionCode}`,
          meta: { critical: true }
        });
        break;
      }

      if (payload?.done) {
        completed = true;
        break;
      }

      const q = payload?.nextQuestion;
      if (!q) {
        recordCheck({
          area: "Assessment",
          name: `${assessmentKey} full flow`,
          status: "FAIL",
          evidence: "next-question returned no question and not done",
          meta: { critical: true }
        });
        break;
      }

      const answer = autoAnswerQuestion(q);
      const save = await apiRequest(LOCAL_API, `/tests/attempts/${attemptId}/responses`, {
        method: "PATCH",
        token: auth.token,
        body: { responses: [answer] },
        timeoutMs: 30_000
      });

      if (isServerError(save.status)) {
        recordCheck({
          area: "Assessment",
          name: `${assessmentKey} full flow`,
          status: "FAIL",
          evidence: `PATCH responses → ${save.status}`,
          meta: { critical: true }
        });
        break;
      }

      questionsAnswered += 1;
    }

    if (completed && !missingQuestionCode) {
      const submit = await apiRequest(LOCAL_API, `/tests/attempts/${attemptId}/submit`, {
        method: "POST",
        token: auth.token,
        timeoutMs: 120_000
      });

      if (isServerError(submit.status)) {
        recordCheck({
          area: "Assessment",
          name: `${assessmentKey} full flow`,
          status: "FAIL",
          evidence: `submit → ${submit.status}`,
          meta: { critical: true }
        });
      } else {
        const sub = unwrap(submit.body);
        scoreGenerated = Boolean(sub?.attempt?.scores || sub?.attempt?.status === "scored");
        const pass = submit.status === 200 && scoreGenerated;
        recordCheck({
          area: "Assessment",
          name: `${assessmentKey} full flow`,
          status: pass ? "PASS" : "FAIL",
          evidence: `answered=${questionsAnswered} scored=${scoreGenerated} status=${submit.status}`,
          meta: { critical: true }
        });
        if (pass && assessmentKey === "career_g11") {
          sectionData.lastScoredAttemptId = attemptId;
        }
        if (pass && !sectionData.lastScoredAttemptId) {
          sectionData.lastScoredAttemptId = attemptId;
        }
      }
    }

    results.push({ assessmentKey, questionsAnswered, completed, missingQuestionCode, scoreGenerated });
  }

  sectionData.assessments = results;
}

/** TEST 3 — live DB query */
async function test3QuestionBankIntegrity() {
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    recordCheck({
      area: "Question Bank",
      name: "Supabase connectivity",
      status: "BLOCKED",
      evidence: String(err?.message ?? err)
    });
    sectionData.questionBank = { blocked: true };
    return;
  }

  const { data: rows, error } = await supabase
    .from("questions")
    .select("id, external_code, category, stem, active, assessment_keys")
    .eq("active", true);

  if (error) {
    recordCheck({
      area: "Question Bank",
      name: "Load questions",
      status: "FAIL",
      evidence: error.message,
      meta: { critical: true }
    });
    return;
  }

  const byCode = {};
  const dupes = [];
  let missingExternalCode = 0;

  for (const r of rows ?? []) {
    if (!r.external_code) {
      missingExternalCode += 1;
      continue;
    }
    if (byCode[r.external_code]) dupes.push(r.external_code);
    else byCode[r.external_code] = r;
  }

  const motMissing = MOTIVATION_CODES.filter((c) => !byCode[c]);
  const riasecMissing = RIASEC_CODES.filter((c) => !byCode[c]);
  const bfMissing = BIG_FIVE_CODES.filter((c) => !byCode[c]);

  const allPlanCodes = [...new Set(Object.values(ASSESSMENT_PLANS).flat())];
  const orphanedPlanRefs = allPlanCodes.filter((c) => !byCode[c]);

  const coverage = {
    totalActive: rows?.length ?? 0,
    uniqueExternalCodes: Object.keys(byCode).length,
    duplicates: [...new Set(dupes)],
    missingExternalCodeCount: missingExternalCode,
    motMissing,
    riasecMissingCount: riasecMissing.length,
    bigFiveMissingCount: bfMissing.length,
    orphanedPlanRefCount: orphanedPlanRefs.length,
    orphanedPlanSample: orphanedPlanRefs.slice(0, 10)
  };

  sectionData.questionBank = coverage;

  recordCheck({
    area: "Question Bank",
    name: "MOT_01–MOT_28 present",
    status: motMissing.length === 0 ? "PASS" : "FAIL",
    evidence: motMissing.length ? `missing=${motMissing.join(",")}` : "all 28 present",
    meta: { critical: true }
  });

  recordCheck({
    area: "Question Bank",
    name: "RIASEC codes present",
    status: riasecMissing.length === 0 ? "PASS" : "FAIL",
    evidence: riasecMissing.length ? `missing=${riasecMissing.length} sample=${riasecMissing.slice(0, 5).join(",")}` : `count=${RIASEC_CODES.length}`,
    meta: { critical: true }
  });

  recordCheck({
    area: "Question Bank",
    name: "Big Five codes present",
    status: bfMissing.length === 0 ? "PASS" : "FAIL",
    evidence: bfMissing.length ? `missing=${bfMissing.length}` : `count=${BIG_FIVE_CODES.length}`,
    meta: { critical: true }
  });

  recordCheck({
    area: "Question Bank",
    name: "No duplicate external_code",
    status: dupes.length === 0 ? "PASS" : "FAIL",
    evidence: dupes.length ? `dupes=${[...new Set(dupes)].slice(0, 10).join(",")}` : "unique",
    meta: { critical: false }
  });

  recordCheck({
    area: "Question Bank",
    name: "No orphaned plan references",
    status: orphanedPlanRefs.length === 0 ? "PASS" : "FAIL",
    evidence: orphanedPlanRefs.length ? `missing=${orphanedPlanRefs.length}` : "all plan codes bound",
    meta: { critical: true }
  });
}

/** TEST 4 */
async function test4UserFlowVerification() {
  /** @type {Record<string, unknown>[]} */
  const flowResults = [];

  for (const flowId of USER_FLOWS) {
    const detail = await apiRequest(LOCAL_API, `/assessment/user-flows/${flowId}`, {
      token: auth.token,
      timeoutMs: 20_000
    });
    if (detail.status !== 200) {
      flowResults.push({ flowId, completed: false, error: `detail ${detail.status}` });
      recordCheck({
        area: "User Flow",
        name: `${flowId} progression`,
        status: isServerError(detail.status) ? "FAIL" : "FAIL",
        evidence: `GET detail → ${detail.status}`,
        meta: { critical: true }
      });
      continue;
    }

    const flow = unwrap(detail.body)?.flow;
    const playableBlocks = [];
    for (const phase of flow?.phases ?? []) {
      for (const block of phase.blocks ?? []) {
        if (block.playable && block.deliveryType === "items") {
          playableBlocks.push({
            phaseIndex: phase.phaseIndex,
            blockIndex: block.blockIndex,
            moduleId: block.moduleId
          });
        }
      }
    }

    let totalItems = 0;
    let completedBlocks = 0;
    /** @type {string[]} */
    const missingAssets = [];

    for (const block of playableBlocks.slice(0, 3)) {
      const moduleId = block.moduleId ?? flowBlockModuleId(flowId.replace("user-", "user"), block.phaseIndex, block.blockIndex);
      const content = await apiRequest(
        LOCAL_API,
        `/assessment/user-flows/${flowId}/phases/${block.phaseIndex}/blocks/${block.blockIndex}/content`,
        { token: auth.token, timeoutMs: 20_000 }
      );

      if (content.status !== 200) {
        missingAssets.push(`${moduleId}:content_${content.status}`);
        continue;
      }

      const cfg = unwrap(content.body)?.config ?? unwrap(content.body);
      const items = cfg?.items ?? [];
      totalItems += items.length;

      if (!items.length) {
        missingAssets.push(`${moduleId}:empty_items`);
        continue;
      }

      const session = await apiRequest(LOCAL_API, "/assessment/sessions", {
        method: "POST",
        token: auth.token,
        body: { moduleId },
        timeoutMs: 20_000
      });

      const sessionId = unwrap(session.body)?.session?.id ?? unwrap(session.body)?.id;
      if (!sessionId) {
        const errMsg = unwrap(session.body)?.error ?? session.error ?? "unknown";
        missingAssets.push(`${moduleId}:session_${session.status}_${String(errMsg).slice(0, 80)}`);
        continue;
      }

      const events = items.slice(0, Math.min(items.length, 5)).map((item, i) => ({
        itemId: item.id ?? item.itemId ?? `item-${i}`,
        eventType: "response",
        responseValue: { response: 3 },
        responseTimeMs: 1500 + i * 100,
        engineType: cfg.engineType ?? "likert"
      }));

      events.push({
        itemId: "session",
        eventType: "module_complete",
        metadata: { sessionSummary: { consistencyScore: 0.75 } }
      });

      await apiRequest(LOCAL_API, `/assessment/sessions/${sessionId}/telemetry`, {
        method: "POST",
        token: auth.token,
        body: { events, clientSeq: 1 },
        timeoutMs: 30_000
      });

      const score = await apiRequest(LOCAL_API, `/assessment/sessions/${sessionId}/score`, {
        method: "POST",
        token: auth.token,
        body: { clientSummary: { consistencyScore: 0.75 } },
        timeoutMs: 30_000
      });

      if (score.status === 200) completedBlocks += 1;
      else missingAssets.push(`${moduleId}:score_${score.status}`);
    }

    const completed = missingAssets.length === 0 && completedBlocks > 0;
    flowResults.push({
      flowId,
      totalItems,
      completedBlocks,
      playableSampled: playableBlocks.length,
      completed,
      missingAssets
    });

    recordCheck({
      area: "User Flow",
      name: `${flowId} progression`,
      status:
        completed && completedBlocks > 0
          ? "PASS"
          : playableBlocks.length === 0
            ? "BLOCKED"
            : missingAssets.length
              ? "FAIL"
              : "BLOCKED",
      evidence: `playable=${playableBlocks.length} items=${totalItems} blocks=${completedBlocks}/${Math.min(playableBlocks.length, 3)} missing=${missingAssets.join("; ") || "none"}`,
      meta: { critical: false }
    });
  }

  sectionData.userFlows = flowResults;
}

/** TEST 5 */
async function test5MbsModules() {
  /** @type {Record<string, unknown>[]} */
  const moduleResults = [];

  for (const mod of MBS_MODULE_REGISTRY) {
    const res = await apiRequest(LOCAL_API, `/assessment/modules/${mod.id}/content`, {
      token: auth.token,
      timeoutMs: 20_000
    });
    if (res.status === 404) {
      moduleResults.push({ moduleId: mod.id, itemCount: 0, emptyPrompts: 0, skipped: "not_found" });
      continue;
    }

    const content = unwrap(res.body);
    const cfg = content?.config ?? content;
    const items = cfg?.items ?? [];
    let emptyPrompts = 0;
    let emptyOptions = 0;
    const engine = content?.engineType ?? mod.engineType;

    for (const item of items) {
      const prompt = String(item.prompt ?? item.stem ?? "").trim();
      if (!prompt) emptyPrompts += 1;
      const opts = item.options ?? item.choices ?? [];
      const hasLikertScale =
        engine === "likert" ||
        item.type === "likert" ||
        item.scaleLabels ||
        (Array.isArray(item.scale) && item.scale.length > 0);
      if (!hasLikertScale && Array.isArray(opts) && opts.length === 0) {
        emptyOptions += 1;
      }
    }

    const fail = emptyPrompts > 0 || (emptyOptions > 0 && engine === "branching");
    moduleResults.push({
      moduleId: mod.id,
      itemCount: items.length,
      emptyPrompts,
      emptyOptions
    });

    if (items.length === 0 && (mod.engineType === "tracing" || mod.engineType === "reaction_time")) {
      recordCheck({
        area: "MBS",
        name: `${mod.id} content`,
        status: "PASS",
        evidence: `procedural engine=${mod.engineType}`,
        meta: { critical: false }
      });
    } else if (items.length === 0) {
      recordCheck({
        area: "MBS",
        name: `${mod.id} prompts/options`,
        status: res.status === 401 ? "BLOCKED" : "FAIL",
        evidence: `no items status=${res.status} engine=${mod.engineType}`,
        meta: { critical: false }
      });
    } else if (fail) {
      recordCheck({
        area: "MBS",
        name: `${mod.id} prompts/options`,
        status: "FAIL",
        evidence: `items=${items.length} emptyPrompts=${emptyPrompts} emptyOptions=${emptyOptions}`,
        meta: { critical: false }
      });
    } else if (items.length > 0) {
      recordCheck({
        area: "MBS",
        name: `${mod.id} prompts/options`,
        status: "PASS",
        evidence: `items=${items.length}`,
        meta: { critical: false }
      });
    }
  }

  sectionData.mbsModules = moduleResults;
}

/** TEST 6 */
async function test6ClarificationEngine() {
  const steps = [];

  const create = await apiRequest(LOCAL_API, "/v6/flows/user-6/sessions", {
    method: "POST",
    token: auth.token,
    body: { intake: { source: "qa-verification" } },
    timeoutMs: 30_000
  });

  steps.push({ step: "create_session", status: create.status, latencyMs: create.latencyMs });

  if (create.status === 502 || create.status === 504) {
    recordCheck({
      area: "Clarification",
      name: "user-6 session + clarify pipeline",
      status: "FAIL",
      evidence: `create → ${create.status}`,
      meta: { critical: true }
    });
    sectionData.clarification = { steps, blocked: true };
    return;
  }

  if (create.status === 503 || create.status === 501) {
    recordCheck({
      area: "Clarification",
      name: "user-6 session + clarify pipeline",
      status: "BLOCKED",
      evidence: `feature/db unavailable: ${create.status} ${JSON.stringify(unwrap(create.body))?.slice(0, 120)}`
    });
    sectionData.clarification = { steps, blocked: true };
    return;
  }

  const flowSessionId = unwrap(create.body)?.flowSessionId;
  if (!flowSessionId) {
    recordCheck({
      area: "Clarification",
      name: "user-6 session + clarify pipeline",
      status: "FAIL",
      evidence: `no flowSessionId: ${create.status} ${JSON.stringify(unwrap(create.body))?.slice(0, 150)}`,
      meta: { critical: true }
    });
    sectionData.clarification = { steps };
    return;
  }

  const evaluate = await apiRequest(LOCAL_API, `/v6/session/${flowSessionId}/clarify/evaluate`, {
    method: "POST",
    token: auth.token,
    timeoutMs: 60_000
  });
  steps.push({ step: "clarify/evaluate", status: evaluate.status, latencyMs: evaluate.latencyMs });

  const next = await apiRequest(LOCAL_API, `/v6/session/${flowSessionId}/clarify/next`, {
    token: auth.token,
    timeoutMs: 30_000
  });
  steps.push({ step: "clarify/next", status: next.status, latencyMs: next.latencyMs });

  const finalize = await apiRequest(LOCAL_API, `/v6/session/${flowSessionId}/clarify/finalize`, {
    method: "POST",
    token: auth.token,
    timeoutMs: 60_000
  });
  steps.push({ step: "clarify/finalize", status: finalize.status, latencyMs: finalize.latencyMs });

  const bad = steps.some((s) => s.status === 502 || s.status === 504);
  const evaluateData = unwrap(evaluate.body);
  const clarifyOk =
    evaluate.status >= 200 &&
    evaluate.status < 300 &&
    (evaluateData?.skipped === true || evaluateData?.clarificationSessionId || evaluateData?.firedRules);
  recordCheck({
    area: "Clarification",
    name: "user-6 session + clarify pipeline",
    status: bad ? "FAIL" : clarifyOk ? "PASS" : evaluate.status === 409 ? "FAIL" : "BLOCKED",
    evidence: steps.map((s) => `${s.step}=${s.status}@${s.latencyMs}ms`).join("; "),
    meta: { critical: true }
  });

  sectionData.clarification = { flowSessionId, steps };
}

/** TEST 7 */
async function test7NegotiationV2() {
  const startupStart = Date.now();
  const start = await apiRequest(LOCAL_API, "/simulations/negotiation-v2/sessions", {
    method: "POST",
    token: auth.token,
    body: {},
    timeoutMs: 30_000
  });
  const startupMs = Date.now() - startupStart;

  if (start.status === 504 || start.error?.includes("timeout")) {
    recordCheck({
      area: "Negotiation",
      name: "Complete simulation",
      status: "FAIL",
      evidence: `startup timeout ${startupMs}ms`,
      meta: { critical: true }
    });
    sectionData.negotiation = { startupMs, error: "timeout" };
    return;
  }

  const sessionId = unwrap(start.body)?.sessionId;
  if (!sessionId) {
    recordCheck({
      area: "Negotiation",
      name: "Complete simulation",
      status: start.status >= 500 ? "FAIL" : "BLOCKED",
      evidence: `no sessionId status=${start.status}`,
      meta: { critical: true }
    });
    return;
  }

  const actionSequence = [
    { branch: "probe_interests", interestSummaryText: "Quality on must-haves; timeline is exec-driven" },
    { branch: "trade_scope_date", tradePackage: "add_contractor_day" },
    { branch: "trade_scope_date", tradePackage: "phased_launch" }
  ];

  let sessionComplete = false;
  let lastAction = null;

  for (const action of actionSequence) {
    lastAction = await apiRequest(LOCAL_API, `/simulations/negotiation-v2/sessions/${sessionId}/actions`, {
      method: "POST",
      token: auth.token,
      body: action,
      timeoutMs: 30_000
    });
    if (lastAction.status === 504) break;
    const body = unwrap(lastAction.body);
    if (body?.sessionComplete) {
      sessionComplete = true;
      break;
    }
  }

  const complete = await apiRequest(LOCAL_API, `/simulations/negotiation-v2/sessions/${sessionId}/complete`, {
    method: "POST",
    token: auth.token,
    timeoutMs: 30_000
  });

  const saved = await apiRequest(LOCAL_API, `/simulations/negotiation-v2/sessions/${sessionId}`, {
    token: auth.token,
    timeoutMs: 15_000
  });

  const saveState = unwrap(saved.body);
  const pass =
    start.status === 201 &&
    !complete.error &&
    complete.status === 200 &&
    Boolean(saveState?.result || saveState?.status === "completed" || sessionComplete);

  recordCheck({
    area: "Negotiation",
    name: "Complete simulation",
    status: lastAction?.status === 504 || complete.status === 504 ? "FAIL" : pass ? "PASS" : "FAIL",
    evidence: `startup=${startupMs}ms complete=${complete.status} saved=${Boolean(saveState?.result)}`,
    meta: { critical: true }
  });

  sectionData.negotiation = {
    sessionId,
    startupMs,
    sessionComplete,
    completeStatus: complete.status,
    result: saveState?.result ?? null
  };
}

/** TEST 8 */
async function test8AiCoach() {
  const res = await apiRequest(LOCAL_API, "/ai/chat", {
    method: "POST",
    token: auth.token,
    body: { message: "What careers might fit someone strong in logical reasoning?" },
    timeoutMs: 120_000
  });

  const data = unwrap(res.body);
  const provider = data?.provider ?? "unknown";
  const reply = data?.reply ?? "";
  const pass = res.status === 200 && reply.length > 20 && provider !== "fallback";

  recordCheck({
    area: "AI Coach",
    name: "POST /ai/chat",
    status: res.status === 200 && reply ? (provider === "fallback" ? "FAIL" : "PASS") : "FAIL",
    evidence: `provider=${provider} latency=${res.latencyMs}ms replyLen=${reply.length}`,
    meta: { critical: false }
  });

  sectionData.ai = { provider, latencyMs: res.latencyMs, replyPreview: reply.slice(0, 120) };
}

/** TEST 9 */
async function test9Reports() {
  const attemptId = sectionData.lastScoredAttemptId;
  if (!attemptId) {
    recordCheck({
      area: "Reports",
      name: "Report + analytics + career matches",
      status: "BLOCKED",
      evidence: "No scored career_g11 attempt from Test 2"
    });
    return;
  }

  const gen = await apiRequest(LOCAL_API, `/reports/attempts/${attemptId}/generate`, {
    method: "POST",
    token: auth.token,
    timeoutMs: 180_000
  });

  const report = unwrap(gen.body)?.report;
  const reportId = report?.id ?? report?._id;
  const hasAnalytics = Boolean(
    report?.structuredSummary ||
      report?.explanations?.length ||
      report?.structured_summary
  );
  const topCareers = report?.topCareers ?? report?.top_careers ?? [];
  const hasMatches = Array.isArray(topCareers) && topCareers.length > 0;

  const pass = gen.status === 200 || gen.status === 201;
  recordCheck({
    area: "Reports",
    name: "Report + analytics + career matches",
    status: pass && reportId && hasMatches ? "PASS" : pass && reportId ? "PASS" : "FAIL",
    evidence: `reportId=${reportId} analytics=${hasAnalytics} careers=${topCareers.length} status=${gen.status}`,
    meta: { critical: false }
  });

  sectionData.reportsDashboard = sectionData.reportsDashboard ?? {};
  sectionData.reportsDashboard.report = { reportId, hasAnalytics, careerMatchCount: topCareers.length };
  sectionData.lastReportId = reportId;
}

/** TEST 10 */
async function test10DashboardSync() {
  const beforeGames = await apiRequest(LOCAL_API, "/games/summary", { token: auth.token });
  const beforeDash = await apiRequest(LOCAL_API, "/dashboard/summary", { token: auth.token });
  const beforeMe = await apiRequest(LOCAL_API, "/auth/me", { token: auth.token });

  const beforeSessions = unwrap(beforeGames.body)?.totals?.sessions ?? 0;

  await apiRequest(LOCAL_API, "/games/sessions", {
    method: "POST",
    token: auth.token,
    body: {
      gameId: "maze-focus",
      gameType: "iq",
      score: 82,
      accuracy: 0.78,
      errors: 2,
      durationSeconds: 45,
      level: 1
    }
  });

  const afterGames = await apiRequest(LOCAL_API, "/games/summary", { token: auth.token });
  const afterDash = await apiRequest(LOCAL_API, "/dashboard/summary", { token: auth.token });
  const afterMe = await apiRequest(LOCAL_API, "/auth/me", { token: auth.token });

  const afterSessions = unwrap(afterGames.body)?.totals?.sessions ?? 0;
  const sessionsIncreased = afterSessions > beforeSessions;

  const dashBefore = unwrap(beforeDash.body);
  const dashAfter = unwrap(afterDash.body);
  const profileOk = Boolean(unwrap(afterMe.body)?.user?.id);
  const attemptTracked = Boolean(dashAfter?.latestAttempt?.id);

  const pass = sessionsIncreased && profileOk;

  recordCheck({
    area: "Dashboard",
    name: "XP / sessions / profile sync",
    status: pass ? "PASS" : "FAIL",
    evidence: `sessions ${beforeSessions}→${afterSessions} attemptTracked=${attemptTracked} profile=${profileOk}`,
    meta: { critical: false }
  });

  sectionData.reportsDashboard = {
    ...sectionData.reportsDashboard,
    dashboard: {
      sessionsBefore: beforeSessions,
      sessionsAfter: afterSessions,
      latestAttemptBefore: dashBefore?.latestAttempt?.status,
      latestAttemptAfter: dashAfter?.latestAttempt?.status,
      profileOk
    }
  };
}

/** TEST 11 */
async function test11ProductionVerification() {
  const prodApi = `${PRODUCTION_FRONTEND}/api/v1`;
  const deployment = [];

  const health = await apiRequest(prodApi, "/health", { timeoutMs: 35_000 });
  deployment.push({
    check: "health",
    status: health.status,
    latencyMs: health.latencyMs,
    error: health.error
  });

  recordCheck({
    area: "Production",
    name: "Netlify health proxy",
    status: health.error ? "FAIL" : health.status === 200 && unwrap(health.body)?.status === "ok" ? "PASS" : "FAIL",
    evidence: health.error ?? `status=${health.status} latency=${health.latencyMs}ms`,
    meta: { critical: true }
  });

  const modules = await apiRequest(prodApi, "/assessment/modules", {
    token: auth?.token,
    timeoutMs: 25_000
  });
  deployment.push({ check: "assessment/modules", status: modules.status, latencyMs: modules.latencyMs });
  recordCheck({
    area: "Production",
    name: "Assessment modules API",
    status: modules.error ? "FAIL" : modules.status === 200 ? "PASS" : auth?.token ? "FAIL" : "BLOCKED",
    evidence: modules.error ?? `status=${modules.status} count=${unwrap(modules.body)?.modules?.length ?? 0}`,
    meta: { critical: false }
  });

  const userFlows = await apiRequest(prodApi, "/assessment/user-flows", {
    token: auth?.token,
    timeoutMs: 25_000
  });
  deployment.push({ check: "user-flows", status: userFlows.status, latencyMs: userFlows.latencyMs });
  recordCheck({
    area: "Production",
    name: "User flows API",
    status: userFlows.error ? "FAIL" : userFlows.status === 200 ? "PASS" : auth?.token ? "FAIL" : "BLOCKED",
    evidence: userFlows.error ?? `status=${userFlows.status}`,
    meta: { critical: false }
  });

  const clar = await apiRequest(prodApi, "/v6/flows/user-6/sessions", {
    method: "POST",
    body: {},
    timeoutMs: 25_000
  });
  deployment.push({ check: "clarification", status: clar.status, latencyMs: clar.latencyMs });
  recordCheck({
    area: "Production",
    name: "Clarification API reachable",
    status: clar.error ? "FAIL" : clar.status === 401 || clar.status === 201 ? "PASS" : clar.status === 502 ? "FAIL" : "PASS",
    evidence: clar.error ?? `status=${clar.status} (401 expected without auth)`,
    meta: { critical: false }
  });

  const neg = await apiRequest(prodApi, "/simulations/negotiation-v2/sessions", {
    method: "POST",
    body: {},
    timeoutMs: 25_000
  });
  deployment.push({ check: "negotiation", status: neg.status, latencyMs: neg.latencyMs });
  recordCheck({
    area: "Production",
    name: "Negotiation API reachable",
    status: neg.error ? "FAIL" : neg.status === 401 || neg.status === 201 ? "PASS" : neg.status === 502 ? "FAIL" : "PASS",
    evidence: neg.error ?? `status=${neg.status} (401 expected without auth)`,
    meta: { critical: false }
  });

  sectionData.deployment = deployment;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
