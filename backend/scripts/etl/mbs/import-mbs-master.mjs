/**
 * Import MBS_Master_Table.xlsx → mbs_domains + onet_mbs_classifications
 *
 * Usage:
 *   node scripts/etl/mbs/import-mbs-master.mjs
 *   node scripts/etl/mbs/import-mbs-master.mjs --path "C:/Users/.../MBS_Master_Table.xlsx"
 *   node scripts/etl/mbs/import-mbs-master.mjs --dry-run
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { domainKey, normalizeMbsMasterRow } from "./lib/normalize-mbs-row.mjs";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const dryRun = args.includes("--dry-run");
const filePath =
  getArg("--path") ||
  process.env.MBS_MASTER_TABLE_PATH ||
  "C:/Users/punya mittal/Downloads/MBS_Master_Table.xlsx";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!dryRun && (!url || !key)) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const supabase = dryRun ? null : createClient(url, key, { auth: { persistSession: false } });

const BATCH = 100;

async function upsertBatch(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: table === "mbs_domains" ? "id" : "soc_code" });
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  console.log(`Reading ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const sheet = wb.SheetNames[0];
  const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
  console.log(`Rows: ${rawRows.length}`);

  const normalized = rawRows.map(normalizeMbsMasterRow).filter((r) => r.socCode && r.mbsDomainId);
  console.log(`Valid rows: ${normalized.length}`);

  const domainMap = new Map();
  for (const row of normalized) {
    if (!domainMap.has(row.mbsDomainId)) {
      domainMap.set(
        row.mbsDomainId,
        domainKey(row.mbsDomainId, row.mbsDomainLabel, row.careerGroup, row.careerDomain)
      );
    }
  }

  const domains = [...domainMap.values()].map((d, i) => ({ ...d, sort_order: i + 1 }));
  const classifications = normalized.map((r) => ({
    soc_code: r.socCode,
    mbs_domain_id: r.mbsDomainId,
    career_group: r.careerGroup,
    career_domain: r.careerDomain,
    confidence: r.confidence,
    highlights: {
      title: r.title,
      description: r.description?.slice(0, 2000) || null,
      coreTasks: r.highlights.coreTasks,
      technologySkills: r.highlights.technologySkills
    },
    updated_at: new Date().toISOString()
  }));

  console.log(`Domains: ${domains.length}`);
  console.log(`Classifications: ${classifications.length}`);

  if (dryRun) {
    console.log("Dry run — sample domain:", domains[0]);
    console.log("Dry run — sample classification:", classifications[0]);
    return;
  }

  for (let i = 0; i < domains.length; i += BATCH) {
    await upsertBatch("mbs_domains", domains.slice(i, i + BATCH));
  }
  for (let i = 0; i < classifications.length; i += BATCH) {
    await upsertBatch("onet_mbs_classifications", classifications.slice(i, i + BATCH));
  }

  console.log("Import complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
