/**
 * O*NET ETL — production import into migration 010 schema.
 *
 * Usage:
 *   npm run etl:onet -- --release 2023.08
 *   npm run etl:onet -- --release 2023.08 --path "C:/path/to/ONET"
 *   npm run etl:onet -- --release 2023.08 --incremental
 *   npm run etl:onet -- --release 2023.08 --extended
 *   npm run etl:onet -- --release 2023.08 --dry-run
 *   npm run etl:onet -- --release 2023.08 --no-activate
 */
import { requireReleaseDir } from "./lib/paths.mjs";
import {
  getEtlSupabase,
  batchInsert,
  batchInsertStream,
  purgeReleaseData,
  applyJobZones,
  activateRelease
} from "./lib/db.mjs";
import { parseOccupations } from "./lib/parsers/occupations.mjs";
import { parseJobZones } from "./lib/parsers/jobZones.mjs";
import { streamAlternateTitles } from "./lib/parsers/alternateTitles.mjs";
import { parseContentModelElements } from "./lib/parsers/elements.mjs";
import { scanElementsFromRatingFiles, streamRatingsFile } from "./lib/parsers/ratings.mjs";
import { streamRelatedOccupations } from "./lib/parsers/relatedOccupations.mjs";
import { streamTechnologySkills } from "./lib/parsers/technologySkills.mjs";
import { buildRiasecVectors, buildProfileV1Vectors } from "./lib/build-vectors.mjs";
import { validateReleaseCounts } from "./lib/validate.mjs";
import { RATING_FILES_CORE, RATING_FILES_EXTENDED } from "./lib/constants.mjs";
import { logInfo, logWarn, logError } from "./lib/logger.mjs";

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const hasFlag = (name) => args.includes(name);

const releaseLabel = getArg("--release") || process.env.ONET_RELEASE_LABEL || "2023.08";
const explicitPath = getArg("--path");
const incremental = hasFlag("--incremental");
const activate = !hasFlag("--no-activate");
const dryRun = hasFlag("--dry-run");
const includeExtended = hasFlag("--extended");

const main = async () => {
  const dir = requireReleaseDir(releaseLabel, explicitPath);
  logInfo(`Starting O*NET ETL`, { releaseLabel, dir, dryRun, incremental, includeExtended });

  if (dryRun) {
    logInfo("Dry run — validating files only");
    const { fileExists } = await import("./lib/excel.mjs");
    const required = ["Occupation Data.xlsx", "Interests.xlsx", "Skills.xlsx"];
    for (const f of required) {
      logInfo(`${f}: ${fileExists(dir, f) ? "OK" : "MISSING"}`);
    }
    return;
  }

  const supabase = getEtlSupabase();
  let releaseId = null;

  if (incremental) {
    const { data } = await supabase
      .from("onet_releases")
      .select("id")
      .eq("version_label", releaseLabel)
      .maybeSingle();
    releaseId = data?.id ?? null;
    if (releaseId) logInfo(`Incremental mode: reusing release ${releaseId}`);
  }

  if (!releaseId) {
    const { data: rel, error: relErr } = await supabase
      .from("onet_releases")
      .insert({
        version_label: releaseLabel,
        source_date: null,
        is_active: false,
        notes: `ETL import from ${dir}`
      })
      .select("id")
      .single();
    if (relErr) throw new Error(relErr.message);
    releaseId = rel.id;
  }

  const rid = releaseId;

  if (!incremental) {
    await purgeReleaseData(supabase, rid);
  }

  const counts = {};
  const { occupations, socSet } = parseOccupations(dir, rid);
  counts.occupations = await batchInsert(supabase, "onet_occupations", occupations);

  const jobZoneBySoc = parseJobZones(dir);
  await applyJobZones(supabase, rid, jobZoneBySoc);

  counts.alternateTitles = await batchInsertStream(
    supabase,
    "onet_alternate_titles",
    streamAlternateTitles(dir, rid, socSet)
  );

  const elementSet = parseContentModelElements(dir, rid);
  const interestsBySoc = new Map();
  const profileAccum = new Map();

  const ratingFiles = includeExtended
    ? [...RATING_FILES_CORE, ...RATING_FILES_EXTENDED]
    : RATING_FILES_CORE;

  const ratingsCtx = {
    releaseId: rid,
    elementSet,
    validSoc: socSet,
    interestsBySoc,
    profileAccum
  };

  await scanElementsFromRatingFiles(dir, ratingFiles, ratingsCtx);
  const elements = [...elementSet.values()];
  counts.elements = await batchInsert(supabase, "onet_elements", elements);

  let ratingsTotal = 0;
  for (const spec of ratingFiles) {
    const stream = streamRatingsFile(dir, spec, ratingsCtx);
    const inserted = await batchInsertStream(supabase, "onet_occupation_ratings", stream);
    ratingsTotal += inserted;
  }
  counts.ratings = ratingsTotal;

  counts.related = await batchInsertStream(
    supabase,
    "onet_related_occupations",
    streamRelatedOccupations(dir, rid, socSet)
  );

  counts.technologySkills = await batchInsertStream(
    supabase,
    "onet_technology_skills",
    streamTechnologySkills(dir, rid, socSet)
  );

  const riasecRows = buildRiasecVectors(interestsBySoc);
  const profileRows = buildProfileV1Vectors(interestsBySoc, profileAccum, riasecRows);

  const vectorRows = [
    ...riasecRows.map((v) => ({ release_id: rid, ...v })),
    ...profileRows.map((v) => ({ release_id: rid, ...v }))
  ];

  counts.riasecVectors = riasecRows.length;
  counts.profileV1Vectors = profileRows.length;
  counts.vectors = await batchInsert(supabase, "onet_occupation_vectors", vectorRows);

  const rowCounts = { ...counts, importedAt: new Date().toISOString() };
  await supabase.from("onet_releases").update({ row_counts: rowCounts }).eq("id", rid);

  const { warnings, errors } = validateReleaseCounts(counts);
  if (errors.length) {
    logError("Validation errors", errors);
    throw new Error("ETL validation failed — release not activated");
  }
  if (warnings.length) {
    logWarn("Validation warnings", warnings);
  } else {
    logInfo("Validation passed");
  }

  if (activate) {
    await activateRelease(supabase, rid, releaseLabel);
  }

  logInfo("ETL complete", rowCounts);
  logInfo(`Release ID: ${rid}`);
};

main().catch((err) => {
  logError("Fatal", err.message);
  process.exit(1);
});
