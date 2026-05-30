/**
 * Validate an imported O*NET release in Postgres.
 *
 *   node scripts/etl/onet/validate-release.mjs --release 2023.08
 */
import { getEtlSupabase } from "./lib/db.mjs";
import { validateReleaseInDb, validateReleaseCounts } from "./lib/validate.mjs";
import { logInfo, logError } from "./lib/logger.mjs";

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};

const releaseLabel = getArg("--release") || process.env.ONET_RELEASE_LABEL || "2023.08";

const main = async () => {
  const supabase = getEtlSupabase();
  const { data: release, error } = await supabase
    .from("onet_releases")
    .select("id, version_label, is_active, row_counts")
    .eq("version_label", releaseLabel)
    .maybeSingle();

  if (error || !release) {
    throw new Error(`Release not found: ${releaseLabel}`);
  }

  const dbCounts = await validateReleaseInDb(supabase, release.id);
  logInfo("DB counts", dbCounts);

  const mapped = {
    occupations: dbCounts.onet_occupations,
    alternateTitles: dbCounts.onet_alternate_titles,
    ratings: dbCounts.onet_occupation_ratings,
    riasecVectors: 0,
    profileV1Vectors: 0
  };

  const { count: riasec } = await supabase
    .from("onet_occupation_vectors")
    .select("*", { count: "exact", head: true })
    .eq("release_id", release.id)
    .eq("vector_type", "riasec");
  const { count: profile } = await supabase
    .from("onet_occupation_vectors")
    .select("*", { count: "exact", head: true })
    .eq("release_id", release.id)
    .eq("vector_type", "profile_v1");

  mapped.riasecVectors = riasec ?? 0;
  mapped.profileV1Vectors = profile ?? 0;

  const { warnings, errors } = validateReleaseCounts(mapped, { strict: false });
  logInfo("Release metadata", {
    id: release.id,
    active: release.is_active,
    storedCounts: release.row_counts
  });
  if (warnings.length) logInfo("Warnings", warnings);
  if (errors.length) {
    logError("Errors", errors);
    process.exit(1);
  }
  logInfo("Validation OK");
};

main().catch((e) => {
  logError(e.message);
  process.exit(1);
});
