/**
 * @param {object} counts
 * @param {{ strict?: boolean }} opts
 */
export const validateReleaseCounts = (counts, opts = {}) => {
  const warnings = [];
  const errors = [];

  if ((counts.occupations ?? 0) < 900) {
    errors.push(`Expected ~1016 occupations, got ${counts.occupations}`);
  }
  if ((counts.riasecVectors ?? 0) < 800) {
    warnings.push(`Expected ~800+ RIASEC vectors, got ${counts.riasecVectors}`);
  }
  if ((counts.profileV1Vectors ?? 0) < 800) {
    warnings.push(`Expected ~800+ profile_v1 vectors, got ${counts.profileV1Vectors}`);
  }
  if ((counts.alternateTitles ?? 0) < 1000) {
    warnings.push(`Expected many alternate titles, got ${counts.alternateTitles}`);
  }
  if ((counts.ratings ?? 0) < 100_000) {
    warnings.push(`Low ratings count (${counts.ratings}); check Excel files`);
  }

  return { warnings, errors: opts.strict ? [...errors, ...warnings] : errors };
};

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} releaseId
 */
export const validateReleaseInDb = async (supabase, releaseId) => {
  const tables = [
    "onet_occupations",
    "onet_alternate_titles",
    "onet_occupation_ratings",
    "onet_occupation_vectors"
  ];
  const counts = {};
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("release_id", releaseId);
    if (error) throw new Error(`${table}: ${error.message}`);
    counts[table] = count ?? 0;
  }
  return counts;
};
