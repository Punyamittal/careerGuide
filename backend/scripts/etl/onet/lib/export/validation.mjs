/**
 * @param {object} params
 */
export const buildValidationReport = ({
  release,
  totalOccupations,
  acceptedCount,
  discarded,
  duplicateRemovals,
  datasets,
  orphanedRelated,
  excelLoaded
}) => {
  const countNull = (rows, field) => rows.filter((r) => r[field] === null || r[field] === undefined).length;

  const occupationFields = ["description", "job_zone", "median_salary", "bright_outlook"];
  const missingFields = {};
  for (const f of occupationFields) {
    missingFields[f] = countNull(datasets.occupationRows, f);
  }

  const nullCounts = {
    occupations_description: missingFields.description,
    occupations_job_zone: missingFields.job_zone,
    abilities: countNull(datasets.abilitiesRows, "importance"),
    skills: countNull(datasets.skillsRows, "level"),
    alternate_titles: countNull(datasets.alternateTitleRows, "source_type"),
    task_statements: datasets.taskStatements.length === 0 ? "not_loaded" : 0,
    education: datasets.educationRows.length === 0 ? "not_loaded" : 0,
    tools_used: datasets.toolsRows.length === 0 ? "not_loaded" : 0,
    vectors: datasets.vectorRows.length
  };

  return {
    generated_at: new Date().toISOString(),
    release_id: release.id,
    release_version: release.version_label,
    totals: {
      occupations_in_database: totalOccupations,
      classified_accepted: acceptedCount,
      discarded_removed: discarded.length,
      duplicate_removals: duplicateRemovals.length
    },
    classification: {
      rule: "accepted = RIASEC vector present, unique SOC/title, not catch-all archived title",
      accepted: acceptedCount,
      discarded: discarded.length
    },
    missing_fields: missingFields,
    null_value_counts: nullCounts,
    duplicate_cleanup: {
      count: duplicateRemovals.length,
      samples: duplicateRemovals.slice(0, 20)
    },
    orphaned_relationships: {
      related_occupations: orphanedRelated.length,
      samples: orphanedRelated.slice(0, 20).map((r) => ({
        soc_code: r.soc_code,
        related_soc_code: r.related_soc_code
      }))
    },
    invalid_mappings: [],
    excel_enrichment_loaded: excelLoaded,
    discarded_samples: discarded.slice(0, 30)
  };
};

export const buildSummaryStatistics = (datasets, validation) => ({
  total_occupations: validation.totals.classified_accepted,
  total_alternate_titles: datasets.alternateTitleRows.length,
  total_skills: datasets.skillsRows.length,
  total_abilities: datasets.abilitiesRows.length,
  total_knowledge: datasets.knowledgeRows.length,
  total_tasks: datasets.taskStatements.length,
  total_emerging_tasks: datasets.emergingTasks.length,
  total_technology_skills: datasets.technologyRows.length,
  total_competencies: datasets.competenciesRows.length,
  total_related_occupations: datasets.relatedRows.length,
  total_ratings_rows:
    datasets.abilitiesRows.length +
    datasets.interestsRows.length +
    datasets.knowledgeRows.length +
    datasets.skillsRows.length +
    datasets.workActivitiesRows.length +
    datasets.workContextRows.length +
    datasets.workStylesRows.length +
    datasets.workValuesRows.length,
  duplicate_cleanup_count: validation.totals.duplicate_removals,
  discarded_removed: validation.totals.discarded_removed,
  missing_data_percentages: {
    description:
      validation.totals.classified_accepted > 0
        ? Math.round((validation.missing_fields.description / validation.totals.classified_accepted) * 10000) / 100
        : 0,
    job_zone:
      validation.totals.classified_accepted > 0
        ? Math.round((validation.missing_fields.job_zone / validation.totals.classified_accepted) * 10000) / 100
        : 0,
    median_salary:
      validation.totals.classified_accepted > 0
        ? Math.round((validation.missing_fields.median_salary / validation.totals.classified_accepted) * 10000) / 100
        : 0
  }
});
