const joinList = (items, limit = 80) => {
  if (!items?.length) return null;
  const text = items.slice(0, limit).join("; ");
  return items.length > limit ? `${text}; … (+${items.length - limit} more)` : text;
};

const groupBySoc = (rows) => {
  const map = new Map();
  for (const row of rows) {
    const key = row.soc_code;
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
};

const topImportanceLabels = (rows, { scaleField = "importance", nameField = "element_name", topN = 12 } = {}) => {
  const im = rows
    .filter((r) => r[scaleField] !== null && r[scaleField] !== undefined)
    .sort((a, b) => Number(b[scaleField]) - Number(a[scaleField]))
    .slice(0, topN)
    .map((r) => `${r[nameField]} (${Number(r[scaleField]).toFixed(2)})`);
  return joinList(im, topN);
};

const interestSummary = (rows) => {
  const oi = rows
    .filter((r) => r.scale_id === "OI" || r.data_value != null)
    .sort((a, b) => Number(b.data_value) - Number(a.data_value))
    .slice(0, 6)
    .map((r) => `${r.riasec_name || r.element_name} [${r.holland_code || "?"}]: ${Number(r.data_value).toFixed(2)}`);
  return joinList(oi, 6);
};

const riasecColumns = (vector) => {
  if (!vector || typeof vector !== "object") {
    return {
      riasec_R: null,
      riasec_I: null,
      riasec_A: null,
      riasec_S: null,
      riasec_E: null,
      riasec_C: null
    };
  }
  return {
    riasec_R: vector.ria_R ?? null,
    riasec_I: vector.ria_I ?? null,
    riasec_A: vector.ria_A ?? null,
    riasec_S: vector.ria_S ?? null,
    riasec_E: vector.ria_E ?? null,
    riasec_C: vector.ria_C ?? null
  };
};

/**
 * One row per classified occupation — stakeholder-friendly wide sheet.
 * @param {object} datasets
 */
export const buildMasterCombinedRows = (datasets) => {
  const alts = groupBySoc(datasets.alternateTitleRows);
  const abilities = groupBySoc(datasets.abilitiesRows);
  const skills = groupBySoc(datasets.skillsRows);
  const knowledge = groupBySoc(datasets.knowledgeRows);
  const interests = groupBySoc(datasets.interestsRows);
  const tech = groupBySoc(datasets.technologyRows);
  const related = groupBySoc(datasets.relatedRows);
  const workStyles = groupBySoc(datasets.workStylesRows);
  const workValues = groupBySoc(datasets.workValuesRows);
  const workActivities = groupBySoc(datasets.workActivitiesRows);
  const workContext = groupBySoc(datasets.workContextRows);

  return datasets.occupationRows.map((occ) => {
    const soc = occ.soc_code;
    const altRows = alts.get(soc) ?? [];
    const techRows = tech.get(soc) ?? [];
    const relRows = related.get(soc) ?? [];

    return {
      soc_code: soc,
      title: occ.title,
      description: occ.description,
      job_zone: occ.job_zone,
      classification_status: occ.classification_status,
      holland_codes: Array.isArray(occ.holland_codes) ? occ.holland_codes.join(", ") : null,
      ...riasecColumns(occ.riasec_vector),
      alternate_title_count: altRows.length,
      alternate_titles: joinList(altRows.map((r) => r.alternate_title)),
      interests_summary: interestSummary(interests.get(soc) ?? []),
      abilities_top: topImportanceLabels(abilities.get(soc) ?? []),
      skills_top: topImportanceLabels(skills.get(soc) ?? []),
      knowledge_top: topImportanceLabels(knowledge.get(soc) ?? []),
      work_styles_top: topImportanceLabels(workStyles.get(soc) ?? []),
      work_values_top: topImportanceLabels(workValues.get(soc) ?? []),
      work_activities_top: topImportanceLabels(workActivities.get(soc) ?? []),
      work_context_top: topImportanceLabels(workContext.get(soc) ?? []),
      technology_skills: joinList(techRows.map((r) => r.example)),
      hot_technology: joinList(
        techRows.filter((r) => r.hot_technology).map((r) => r.example),
        30
      ),
      related_occupations: joinList(
        relRows.map((r) => `${r.related_title || r.related_soc_code} (${r.related_soc_code})`),
        20
      ),
      bright_outlook: occ.bright_outlook,
      green_occupation: occ.green_occupation,
      median_salary: occ.median_salary
    };
  });
};

/**
 * Single long-format sheet for all rating domains (filter/pivot friendly).
 */
export const buildAllRatingsCombinedRows = (datasets) => {
  const withDomain = (domain, rows, extra = {}) =>
    rows.map((r) => ({
      soc_code: r.soc_code,
      occupation_title: r.occupation_title,
      domain,
      element_id: r.element_id ?? null,
      element_name: r.element_name,
      category: r.category ?? r.skill_category ?? null,
      holland_code: r.holland_code ?? null,
      scale_id: r.scale_id,
      importance: r.importance ?? (r.scale_id === "IM" ? r.data_value : null),
      level: r.level ?? (r.scale_id === "LV" ? r.data_value : null),
      data_value: r.data_value ?? r.importance ?? r.level ?? null,
      ...extra
    }));

  return [
    ...withDomain("ability", datasets.abilitiesRows),
    ...withDomain("interest", datasets.interestsRows),
    ...withDomain("knowledge", datasets.knowledgeRows),
    ...withDomain("skill", datasets.skillsRows),
    ...withDomain("work_style", datasets.workStylesRows),
    ...withDomain("work_value", datasets.workValuesRows),
    ...withDomain("work_activity", datasets.workActivitiesRows),
    ...withDomain("work_context", datasets.workContextRows),
    ...datasets.competenciesRows.map((r) => ({
      soc_code: r.soc_code,
      occupation_title: r.occupation_title,
      domain: "competency",
      element_id: r.work_activity_id,
      element_name: r.work_activity_name,
      category: null,
      holland_code: null,
      scale_id: r.scale_id,
      importance: r.competency_score,
      level: null,
      data_value: r.competency_score
    }))
  ];
};

/**
 * Alternate titles, technology, and related occupations in one filterable sheet.
 */
export const buildSupportingCombinedRows = (datasets) => {
  const rows = [];

  for (const r of datasets.alternateTitleRows) {
    rows.push({
      soc_code: r.soc_code,
      occupation_title: r.occupation_title,
      record_type: "alternate_title",
      primary_label: r.alternate_title,
      secondary_label: r.short_title,
      detail: r.source_type
    });
  }

  for (const r of datasets.technologyRows) {
    rows.push({
      soc_code: r.soc_code,
      occupation_title: r.occupation_title,
      record_type: "technology_skill",
      primary_label: r.example,
      secondary_label: r.commodity_title,
      detail: r.hot_technology ? "hot" : r.in_demand ? "in_demand" : r.category
    });
  }

  for (const r of datasets.relatedRows) {
    rows.push({
      soc_code: r.soc_code,
      occupation_title: r.occupation_title,
      record_type: "related_occupation",
      primary_label: r.related_title,
      secondary_label: r.related_soc_code,
      detail: r.relatedness_tier
    });
  }

  for (const r of datasets.taskStatements) {
    rows.push({
      soc_code: r.soc_code,
      occupation_title: null,
      record_type: "task_statement",
      primary_label: r.task_statement,
      secondary_label: r.task_id,
      detail: r.task_type
    });
  }

  for (const r of datasets.educationRows) {
    rows.push({
      soc_code: r.soc_code,
      occupation_title: null,
      record_type: "education_training",
      primary_label: r.element_name,
      secondary_label: r.category,
      detail: r.scale_id
    });
  }

  return rows.sort((a, b) => {
    const t = String(a.occupation_title || "").localeCompare(String(b.occupation_title || ""));
    if (t !== 0) return t;
    return String(a.record_type).localeCompare(String(b.record_type));
  });
};

export const MASTER_COMBINED_COLUMNS = [
  "soc_code",
  "title",
  "description",
  "job_zone",
  "classification_status",
  "holland_codes",
  "riasec_R",
  "riasec_I",
  "riasec_A",
  "riasec_S",
  "riasec_E",
  "riasec_C",
  "alternate_title_count",
  "alternate_titles",
  "interests_summary",
  "abilities_top",
  "skills_top",
  "knowledge_top",
  "work_styles_top",
  "work_values_top",
  "work_activities_top",
  "work_context_top",
  "technology_skills",
  "hot_technology",
  "related_occupations",
  "bright_outlook",
  "green_occupation",
  "median_salary"
];

export const RATINGS_COMBINED_COLUMNS = [
  "soc_code",
  "occupation_title",
  "domain",
  "element_id",
  "element_name",
  "category",
  "holland_code",
  "scale_id",
  "importance",
  "level",
  "data_value"
];

export const SUPPORTING_COMBINED_COLUMNS = [
  "soc_code",
  "occupation_title",
  "record_type",
  "primary_label",
  "secondary_label",
  "detail"
];
