/**
 * Shared helpers for live QA verification scripts.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });
dotenv.config({ path: join(__dirname, "../../../frontend/.env") });
dotenv.config({ path: join(__dirname, "../../../frontend/.env.local") });

export const LOCAL_API = (
  process.env.API_BASE_URL ?? `http://127.0.0.1:${process.env.PORT || 5000}/api/v1`
).replace(/\/$/, "");

export const PRODUCTION_FRONTEND = (
  process.env.QA_PRODUCTION_URL ?? "https://brainstyle.netlify.app"
).replace(/\/$/, "");

/** @typedef {"PASS"|"FAIL"|"BLOCKED"} QaStatus */

/**
 * @typedef {Object} QaCheck
 * @property {string} id
 * @property {string} area
 * @property {string} name
 * @property {QaStatus} status
 * @property {string} [evidence]
 * @property {Record<string, unknown>} [meta]
 */

/** @type {QaCheck[]} */
export const checks = [];

/**
 * @param {Partial<QaCheck> & Pick<QaCheck, "area"|"name"|"status">} entry
 */
export function recordCheck(entry) {
  const id = entry.id ?? `${entry.area}:${entry.name}`.replace(/\s+/g, "_").slice(0, 80);
  checks.push({
    id,
    area: entry.area,
    name: entry.name,
    status: entry.status,
    evidence: entry.evidence ?? "",
    meta: entry.meta ?? {}
  });
  return checks[checks.length - 1];
}

export function summarizeChecks(list = checks) {
  const total = list.length;
  const pass = list.filter((c) => c.status === "PASS").length;
  const fail = list.filter((c) => c.status === "FAIL").length;
  const blocked = list.filter((c) => c.status === "BLOCKED").length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  return { total, pass, fail, blocked, passPct: pct(pass), failPct: pct(fail), blockedPct: pct(blocked) };
}

/**
 * @param {string} baseUrl
 * @param {string} path
 * @param {RequestInit & { token?: string; timeoutMs?: number }} [opts]
 */
export async function apiRequest(baseUrl, path, opts = {}) {
  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = { "Content-Type": "application/json", ...(opts.headers ?? {}) };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const timeoutMs = opts.timeoutMs ?? 120_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const res = await fetch(url, {
      ...opts,
      headers,
      signal: controller.signal,
      body: opts.body != null && typeof opts.body !== "string" ? JSON.stringify(opts.body) : opts.body
    });
    const latencyMs = Date.now() - started;
    let body = null;
    const text = await res.text().catch(() => "");
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { _raw: text.slice(0, 500) };
    }
    return { ok: res.ok, status: res.status, latencyMs, body, url };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const message = err?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(err?.message ?? err);
    return { ok: false, status: 0, latencyMs, body: null, url, error: message };
  } finally {
    clearTimeout(timer);
  }
}

/** Unwrap `{ success, data }` envelope when present. */
export function unwrap(body) {
  if (body && typeof body === "object" && "data" in body && body.success !== false) {
    return body.data ?? body;
  }
  return body;
}

export function isServerError(status) {
  return status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Resolve JWT for QA: TEST_AUTH_TOKEN, or create ephemeral Supabase user.
 * @returns {Promise<{ token: string; userId: string; email: string; created: boolean }>}
 */
export async function resolveAuthToken() {
  const preset = process.env.TEST_AUTH_TOKEN?.trim();
  if (preset) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(preset);
    if (error || !data?.user?.id) {
      throw new Error(`TEST_AUTH_TOKEN invalid: ${error?.message ?? "no user"}`);
    }
    return { token: preset, userId: data.user.id, email: data.user.email ?? "preset", created: false };
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for programmatic login");
  }

  if (!anonKey) {
    throw new Error(
      "SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, or VITE_SUPABASE_ANON_KEY required to sign in test user"
    );
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `qa-${Date.now()}-${randomUUID().slice(0, 8)}@careerguide.qa`;
  const password = `Qa!${randomUUID().replace(/-/g, "")}9`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "QA Automation", source: "realtime-qa-verification" }
  });

  if (createErr || !created?.user?.id) {
    throw new Error(`Failed to create test user: ${createErr?.message ?? "unknown"}`);
  }

  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: session, error: signErr } = await client.auth.signInWithPassword({ email, password });
  if (signErr || !session?.session?.access_token) {
    throw new Error(`Failed to sign in test user: ${signErr?.message ?? "no session"}`);
  }

  return {
    token: session.session.access_token,
    userId: created.user.id,
    email,
    created: true
  };
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Build adaptive assessment response payload from a served question.
 * @param {object} q
 */
export function autoAnswerQuestion(q) {
  const questionId = String(q._id ?? q.id);
  const category = q.category;

  if (category === "writing") {
    return {
      questionId,
      category,
      writingText:
        "I enjoy solving problems and learning new skills. I want a career where I can grow and help others."
    };
  }

  if (q.useLikert || category === "big5" || category === "riasec") {
    return { questionId, category, likertValue: 3 };
  }

  const firstKey = q.options?.[0]?.key ?? "A";
  return { questionId, category, selectedOptionKey: firstKey };
}
