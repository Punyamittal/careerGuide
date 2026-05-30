import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { logInfo, logWarn } from "./logger.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../../.env") });

const DEFAULT_BATCH = Number(process.env.ETL_BATCH_SIZE) || 400;
const MAX_RETRIES = Number(process.env.ETL_MAX_RETRIES) || 3;

export const getEtlSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in backend/.env");
  }
  return createClient(url, key, { auth: { persistSession: false } });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {() => Promise<void>} fn
 */
export const withRetry = async (fn, label = "operation") => {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      logWarn(`${label} failed (attempt ${attempt}/${MAX_RETRIES})`, err.message);
      if (attempt < MAX_RETRIES) await sleep(500 * attempt);
    }
  }
  throw lastErr;
};

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} table
 * @param {object[]} rows
 * @param {number} [batchSize]
 */
export const batchInsert = async (supabase, table, rows, batchSize = DEFAULT_BATCH) => {
  if (!rows.length) return 0;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    await withRetry(async () => {
      const { error } = await supabase.from(table).insert(chunk);
      if (error) throw new Error(error.message);
    }, `${table} insert @${i}`);
    inserted += chunk.length;
    if (inserted % 5000 === 0 || i + batchSize >= rows.length) {
      logInfo(`${table}: ${inserted}/${rows.length}`);
    }
  }
  return inserted;
};

/**
 * Stream batches to DB without holding full dataset in memory for insert.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} table
 * @param {AsyncGenerator<object[]>} batchGenerator
 */
export const batchInsertStream = async (supabase, table, batchGenerator) => {
  let inserted = 0;
  for await (const chunk of batchGenerator) {
    if (!chunk.length) continue;
    await withRetry(async () => {
      const { error } = await supabase.from(table).insert(chunk);
      if (error) throw new Error(error.message);
    }, `${table} stream insert`);
    inserted += chunk.length;
    if (inserted % 10000 === 0) logInfo(`${table} streamed: ${inserted}`);
  }
  return inserted;
};

/** Delete all release-scoped rows (rollback-safe re-import). */
export const purgeReleaseData = async (supabase, releaseId) => {
  await supabase.from("attempt_occupation_matches").delete().eq("release_id", releaseId);

  const tables = [
    "onet_occupation_embeddings",
    "onet_occupation_vectors",
    "onet_technology_skills",
    "onet_related_occupations",
    "onet_occupation_ratings",
    "onet_alternate_titles",
    "onet_elements",
    "onet_occupations"
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("release_id", releaseId);
    if (error) throw new Error(`purge ${table}: ${error.message}`);
    logInfo(`purged ${table} for release ${releaseId}`);
  }
};

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} releaseId
 * @param {Map<string, number>} jobZoneBySoc
 */
export const applyJobZones = async (supabase, releaseId, jobZoneBySoc) => {
  const entries = [...jobZoneBySoc.entries()].filter(([, z]) => Number.isFinite(z));
  const chunkSize = 100;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const slice = entries.slice(i, i + chunkSize);
    await Promise.all(
      slice.map(([soc_code, job_zone]) =>
        supabase
          .from("onet_occupations")
          .update({ job_zone })
          .eq("release_id", releaseId)
          .eq("soc_code", soc_code)
      )
    );
  }
  logInfo(`job zones applied: ${entries.length}`);
};

export const activateRelease = async (supabase, releaseId, versionLabel) => {
  const { error: rpcErr } = await supabase.rpc("onet_set_active_release", {
    p_release_id: releaseId
  });
  if (rpcErr) {
    await supabase.from("onet_releases").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase
      .from("onet_releases")
      .update({ is_active: true })
      .eq("id", releaseId);
    if (error) throw new Error(`activate release: ${error.message}`);
  }
  logInfo(`activated release ${versionLabel} (${releaseId})`);
};

export const inferElementDomain = (elementId, elementName = "") => {
  const id = String(elementId || "");
  if (id.startsWith("1.B.1")) return "interest";
  if (id.startsWith("1.A")) return "ability";
  if (id.startsWith("2.C")) return "knowledge";
  if (id.startsWith("2.A")) return "skill";
  if (id.startsWith("4.A")) return "work_activity";
  if (id.startsWith("4.C")) return "work_context";
  if (id.startsWith("1.C")) return "work_style";
  if (id.startsWith("1.B.2")) return "work_value";
  const n = String(elementName).toLowerCase();
  if (n.includes("interest")) return "interest";
  return "other";
};
