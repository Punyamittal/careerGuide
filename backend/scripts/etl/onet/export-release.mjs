/**
 * Export classified O*NET occupations from Supabase to JSON/CSV/Excel.
 *
 * Usage:
 *   npm run onet:export
 *   npm run onet:export -- --dry-run
 *   npm run onet:export -- --release=2023.08
 *   npm run onet:export -- --release=<uuid>
 *   npm run onet:excel-export
 *   node scripts/etl/onet/export-release.mjs --excel
 */
import dotenv from "dotenv";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import os from "os";

import { getEtlSupabase } from "./lib/db.mjs";
import { logInfo, logError } from "./lib/logger.mjs";
import { fetchAllRows } from "./lib/export/fetch.mjs";
import { classifyOccupations } from "./lib/export/classify.mjs";
import {
  buildExportDatasets,
  buildIndexes,
  buildRelationshipMaps
} from "./lib/export/transform.mjs";
import { writeCsv } from "./lib/export/csv.mjs";
import { ensureExportDir, exportFile, exportRoot } from "./lib/export/paths.mjs";
import {
  buildValidationReport,
  buildSummaryStatistics
} from "./lib/export/validation.mjs";
import { loadExcelExtras, extractSourcePathFromNotes } from "./lib/export/excel-extras.mjs";
import { writeExcelWorkbook } from "./lib/export/excel-workbook.mjs";
import { writeSchemaArtifacts } from "./lib/export/schemas.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, "../../..");
dotenv.config({ path: resolve(backendRoot, ".env") });

const args = process.argv.slice(2);
const getArg = (name) => {
  const pref = `${name}=`;
  const eq = args.find((a) => a.startsWith(pref));
  if (eq) return eq.slice(pref.length);
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const hasFlag = (name) => args.includes(name);

const releaseArg = getArg("--release");
const dryRun = hasFlag("--dry-run");
const writeExcel = hasFlag("--excel") || process.env.npm_lifecycle_event === "onet:excel-export";

const resolveRelease = async (supabase) => {
  if (releaseArg) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(releaseArg);
    const q = supabase.from("onet_releases").select("*");
    const { data, error } = await (isUuid ? q.eq("id", releaseArg) : q.eq("version_label", releaseArg)).maybeSingle();
    if (error || !data) throw new Error(`Release not found: ${releaseArg}`);
    return data;
  }

  const { data: active, error: activeErr } = await supabase
    .from("onet_releases")
    .select("*")
    .eq("is_active", true)
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeErr) throw new Error(activeErr.message);
  if (active) return active;

  const { data: latest, error: latestErr } = await supabase
    .from("onet_releases")
    .select("*")
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr || !latest) throw new Error("No O*NET release found in onet_releases");
  return latest;
};

const writeJson = (name, obj) => {
  writeFileSync(exportFile(name), JSON.stringify(obj, null, 2), "utf8");
};

const main = async () => {
  const started = Date.now();
  const supabase = getEtlSupabase();
  const release = await resolveRelease(supabase);

  logInfo("O*NET export starting", {
    releaseId: release.id,
    version: release.version_label,
    active: release.is_active,
    dryRun,
    excel: writeExcel
  });

  if (dryRun) {
    const { count } = await supabase
      .from("onet_occupations")
      .select("*", { count: "exact", head: true })
      .eq("release_id", release.id);
    logInfo("Dry run complete", { occupationsInDb: count, release: release.version_label });
    return;
  }

  ensureExportDir();
  const rid = release.id;

  const [occupations, vectors, elements, alternateTitles, related, technologySkills, embeddings] =
    await Promise.all([
      fetchAllRows(supabase, "onet_occupations", { release_id: rid }, "*", {
        order: "title",
        ascending: true
      }),
      fetchAllRows(supabase, "onet_occupation_vectors", { release_id: rid }),
      fetchAllRows(supabase, "onet_elements", { release_id: rid }),
      fetchAllRows(supabase, "onet_alternate_titles", { release_id: rid }),
      fetchAllRows(supabase, "onet_related_occupations", { release_id: rid }),
      fetchAllRows(supabase, "onet_technology_skills", { release_id: rid }),
      fetchAllRows(supabase, "onet_occupation_embeddings", { release_id: rid })
    ]);

  logInfo("Fetched core tables", {
    occupations: occupations.length,
    vectors: vectors.length,
    ratingsPending: "loading",
    alternateTitles: alternateTitles.length
  });

  const ratings = await fetchAllRows(supabase, "onet_occupation_ratings", { release_id: rid });
  logInfo("Fetched ratings", { count: ratings.length });

  const riasecSocSet = new Set(
    vectors.filter((v) => v.vector_type === "riasec").map((v) => v.soc_code)
  );

  const { accepted, discarded, acceptedSocSet, duplicateRemovals } = classifyOccupations(
    occupations,
    riasecSocSet
  );

  const elementsById = new Map(elements.map((e) => [e.element_id, e]));

  const excelPath = getArg("--path") || extractSourcePathFromNotes(release.notes);
  const { extras: excelExtras, loaded: excelLoaded } = loadExcelExtras(excelPath);

  const datasets = buildExportDatasets({
    release,
    accepted,
    acceptedSocSet,
    elementsById,
    ratings,
    alternateTitles,
    related,
    technologySkills,
    vectors,
    embeddings,
    excelExtras
  });

  const indexes = buildIndexes(accepted, datasets);
  const { soc_to_related, soc_to_technology, orphaned_related } = buildRelationshipMaps(
    datasets,
    acceptedSocSet
  );

  const validation = buildValidationReport({
    release,
    totalOccupations: occupations.length,
    acceptedCount: accepted.length,
    discarded,
    duplicateRemovals,
    datasets,
    orphanedRelated: orphaned_related,
    excelLoaded
  });

  const summary = buildSummaryStatistics(datasets, validation);

  writeJson("occupations.json", datasets.occupationRows);
  writeJson(
    "master_dataset.json",
    {
      meta: {
        export_timestamp: validation.generated_at,
        release_id: release.id,
        release_version: release.version_label,
        classification_rule: validation.classification.rule,
        total_classified: accepted.length
      },
      occupations: datasets.masterOccupations.slice(0, 50),
      note: "Full per-occupation payloads available in occupations.json and category CSVs; master_dataset truncated to 50 samples"
    }
  );

  writeCsv(exportFile("occupations.csv"), [
    "soc_code",
    "title",
    "description",
    "job_zone",
    "bright_outlook",
    "green_occupation",
    "median_salary",
    "classification_status"
  ], datasets.occupationRows);

  const csvExports = [
    ["alternate_titles.csv", ["soc_code", "occupation_title", "alternate_title", "short_title", "source_type", "synonym"], datasets.alternateTitleRows],
    ["abilities.csv", ["soc_code", "occupation_title", "element_id", "element_name", "category", "scale_id", "importance", "level"], datasets.abilitiesRows],
    ["interests.csv", ["soc_code", "occupation_title", "element_name", "holland_code", "scale_id", "data_value"], datasets.interestsRows],
    ["knowledge.csv", ["soc_code", "occupation_title", "element_id", "element_name", "scale_id", "importance", "level"], datasets.knowledgeRows],
    ["skills.csv", ["soc_code", "occupation_title", "element_id", "element_name", "skill_category", "scale_id", "importance", "level"], datasets.skillsRows],
    ["education.csv", ["soc_code", "element_id", "element_name", "scale_id", "category", "data_value", "required_education", "experience_level", "training_requirement"], datasets.educationRows],
    ["task_statements.csv", ["soc_code", "task_id", "task_statement", "task_type", "is_emerging"], datasets.taskStatements],
    ["emerging_tasks.csv", ["soc_code", "task_id", "task_statement", "task_type", "is_emerging"], datasets.emergingTasks],
    ["task_ratings.csv", ["soc_code", "task_id", "scale_id", "scale_name", "data_value", "importance", "frequency", "criticality"], datasets.taskRatings],
    ["technology_skills.csv", ["soc_code", "occupation_title", "example", "commodity_title", "category", "hot_technology", "in_demand"], datasets.technologyRows],
    ["tools_used.csv", ["soc_code", "tool_name", "commodity_code", "commodity_title", "category"], datasets.toolsRows],
    ["work_activities.csv", ["soc_code", "occupation_title", "element_id", "element_name", "scale_id", "importance", "level"], datasets.workActivitiesRows],
    ["work_context.csv", ["soc_code", "occupation_title", "element_id", "element_name", "scale_id", "importance", "level"], datasets.workContextRows],
    ["work_styles.csv", ["soc_code", "occupation_title", "element_id", "element_name", "scale_id", "importance", "level"], datasets.workStylesRows],
    ["work_values.csv", ["soc_code", "occupation_title", "element_id", "element_name", "scale_id", "importance", "level"], datasets.workValuesRows],
    ["competencies.csv", ["soc_code", "occupation_title", "work_activity_id", "work_activity_name", "competency_score", "scale_id"], datasets.competenciesRows],
    ["related_occupations.csv", ["soc_code", "occupation_title", "related_soc_code", "related_title", "relatedness_tier", "match_index"], datasets.relatedRows],
    ["vectors.csv", ["soc_code", "vector_type", "vector_json"], datasets.vectorRows]
  ];

  for (const [file, cols, rows] of csvExports) {
    writeCsv(exportFile(file), cols, rows);
  }

  writeJson("validation_report.json", validation);
  writeJson("summary_statistics.json", summary);
  writeJson("relationship_maps.json", {
    soc_to_related,
    soc_to_technology,
    orphaned_related_count: orphaned_related.length
  });

  writeJson(
    "sample_previews.json",
    {
      occupations: datasets.occupationRows.slice(0, 3),
      abilities: datasets.abilitiesRows.slice(0, 5),
      skills: datasets.skillsRows.slice(0, 5),
      technology_skills: datasets.technologyRows.slice(0, 5)
    }
  );

  writeSchemaArtifacts(indexes);

  const meta = {
    export_timestamp: validation.generated_at,
    release_id: release.id,
    release_version: release.version_label,
    total_occupations_exported: accepted.length,
    discarded_rows_removed: discarded.length,
    database_source: process.env.SUPABASE_URL ?? "supabase",
    generation_environment: `${os.platform()} ${os.release()} | node ${process.version}`,
    excel_enrichment: excelLoaded
  };

  let excelResult = null;
  if (writeExcel) {
    excelResult = await writeExcelWorkbook({
      meta,
      datasets,
      validation,
      summary
    });
  }

  const durationMs = Date.now() - started;
  const integrity = {
    occupations_json_matches_accepted: datasets.occupationRows.length === accepted.length,
    all_accepted_have_riasec: accepted.every((o) => riasecSocSet.has(o.soc_code)),
    csv_files_written: csvExports.length + 1,
    ratings_exported: datasets.abilitiesRows.length + datasets.skillsRows.length > 0
  };

  writeJson("data_integrity_checks.json", integrity);

  logInfo("Export completed successfully", {
    exportDir: exportRoot,
    classifiedOccupations: accepted.length,
    discardedRemoved: discarded.length,
    durationMs
  });

  console.log("\n=== O*NET Export Summary ===");
  console.log(`Release: ${release.version_label} (${release.id})`);
  console.log(`Classified occupations exported: ${accepted.length}`);
  console.log(`Discarded occupations removed: ${discarded.length}`);
  console.log(`Duplicate cleanup: ${duplicateRemovals.length}`);
  console.log(`Export directory: ${exportRoot}`);
  console.log(`Duration: ${(durationMs / 1000).toFixed(2)}s`);
  console.log("Missing field stats:", validation.missing_fields);

  if (excelResult) {
    console.log("\n=== Excel Workbook ===");
    console.log("workbook generated successfully");
    console.log(`worksheet count: ${excelResult.worksheetCount}`);
    console.log(`total exported occupations: ${accepted.length}`);
    console.log(`excel file path: ${excelResult.path}`);
    console.log(`combined excel path: ${excelResult.combinedPath}`);
    console.log(
      `combined sheets: Master=${excelResult.combinedMasterRows} rows, Ratings=${excelResult.combinedRatingsRows} rows, Supporting=${excelResult.combinedSupportingRows} rows`
    );
    console.log(`export duration: ${(durationMs / 1000).toFixed(2)}s`);
    console.log("validation summary:", {
      accepted: validation.totals.classified_accepted,
      discarded: validation.totals.discarded_removed,
      orphaned_related: validation.orphaned_relationships.related_occupations
    });
  }
};

main().catch((err) => {
  logError("Export failed", err.message);
  console.error(err);
  process.exit(1);
});
