/**
 * End-to-end pipeline validation (requires Supabase env + optional TEST_USER_ID + TEST_AUTH_TOKEN).
 * Run: node scripts/validate-assessment-pipeline.mjs
 */
import "dotenv/config";

const API = process.env.API_BASE_URL ?? "http://127.0.0.1:5000/api/v1";
const token = process.env.TEST_AUTH_TOKEN;
const userId = process.env.TEST_USER_ID;

const report = { steps: [], ok: true };

function step(name, pass, detail) {
  report.steps.push({ name, pass, detail });
  if (!pass) report.ok = false;
  console.log(`${pass ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers ?? {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  const health = await fetch(`${API.replace("/api/v1", "")}/health`).catch(() => null);
  step("Backend reachable", Boolean(health?.ok), health?.status);

  const domains = await api("/mbs/domains");
  step(
    "GET /mbs/domains",
    domains.status === 200 && (domains.body?.data?.length ?? domains.body?.length ?? 0) > 0,
    `count=${domains.body?.data?.length ?? "n/a"}`
  );

  if (!token) {
    step("Authenticated pipeline", false, "Set TEST_AUTH_TOKEN to run session→score→profile→recommendations");
    console.log("\nReport:", JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }

  const modules = await api("/assessment/modules");
  const list = modules.body?.data?.modules ?? modules.body?.modules ?? [];
  step("GET /assessment/modules", modules.status === 200 && list.length > 0, `modules=${list.length}`);

  const session = await api("/assessment/sessions", {
    method: "POST",
    body: JSON.stringify({ moduleId: "M03" })
  });
  const sessionId = session.body?.data?.session?.id ?? session.body?.session?.id;
  step("POST /assessment/sessions", session.status === 201 && Boolean(sessionId), sessionId);

  if (sessionId) {
    const tel = await api(`/assessment/sessions/${sessionId}/telemetry`, {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            itemId: "M3-F01",
            eventType: "response",
            responseValue: { response: 4 },
            responseTimeMs: 2100,
            engineType: "likert"
          },
          {
            itemId: "session",
            eventType: "module_complete",
            metadata: {
              sessionSummary: {
                categoryScores: { growth_motivation: 0.75 },
                dominantPattern: "Growth",
                consistencyScore: 0.8
              }
            }
          }
        ],
        clientSeq: 1
      })
    });
    step("POST telemetry", tel.status === 200, `ingested=${tel.body?.data?.ingested ?? "?"}`);

    const score = await api(`/assessment/sessions/${sessionId}/score`, {
      method: "POST",
      body: JSON.stringify({
        clientSummary: { categoryScores: { growth_motivation: 0.75 }, consistencyScore: 0.8 }
      })
    });
    const cs = score.body?.data?.score?.construct_scores ?? score.body?.score?.construct_scores;
    step(
      "POST score",
      score.status === 200 && cs && Object.keys(cs).length > 0,
      `constructs=${Object.keys(cs ?? {}).join(",")}`
    );
  }

  const rec = await api("/mbs/recommendations");
  const occ = rec.body?.data?.occupations ?? rec.body?.occupations ?? [];
  step(
    "GET /mbs/recommendations",
    rec.status === 200 && occ.length > 0,
    `occupations=${occ.length}`
  );

  const chat = await api("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message: "Why might software engineering fit me?" })
  });
  const reply = chat.body?.data?.reply ?? chat.body?.reply;
  step("POST /ai/chat (coach)", chat.status === 200 && Boolean(reply), reply?.slice(0, 60));

  console.log("\nReport:", JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
