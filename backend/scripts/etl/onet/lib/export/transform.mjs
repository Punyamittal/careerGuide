import { hollandCodeForInterest, resolveExportDomain } from "./domain.mjs";
import { ONET_INTEREST_TO_RIASEC } from "../constants.mjs";
import { SCALE } from "../constants.mjs";

const nullNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

/**
 * @param {object} ctx
 */
export const buildExportDatasets = (ctx) => {
  const {
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
  } = ctx;

  const occBySoc = new Map(accepted.map((o) => [o.soc_code, o]));
  const vectorsBySoc = new Map();
  for (const v of vectors) {
    if (!vectorsBySoc.has(v.soc_code)) vectorsBySoc.set(v.soc_code, {});
    vectorsBySoc.get(v.soc_code)[v.vector_type] = v.vector;
  }

  const ratingsBySoc = new Map();
  for (const r of ratings) {
    if (!acceptedSocSet.has(r.soc_code)) continue;
    if (!ratingsBySoc.has(r.soc_code)) ratingsBySoc.set(r.soc_code, []);
    ratingsBySoc.get(r.soc_code).push(r);
  }

  const occupationRows = [];
  const abilitiesRows = [];
  const interestsRows = [];
  const knowledgeRows = [];
  const skillsRows = [];
  const workStylesRows = [];
  const workValuesRows = [];
  const workActivitiesRows = [];
  const workContextRows = [];
  const competenciesRows = [];

  for (const occ of accepted) {
    const extra = excelExtras?.occupations?.get(occ.soc_code) ?? {};
    const vecs = vectorsBySoc.get(occ.soc_code) ?? {};
    const occRatings = ratingsBySoc.get(occ.soc_code) ?? [];

    const interestOi = [];
    for (const r of occRatings) {
      if (r.scale_id !== SCALE.OCCUPATIONAL_INTERESTS) continue;
      const domain = resolveExportDomain(
        r.element_id,
        r.element_name,
        elementsById.get(r.element_id)?.domain
      );
      if (domain !== "interest") continue;
      const holland = hollandCodeForInterest(r.element_name);
      interestOi.push({ element_name: r.element_name, holland_code: holland, score: r.data_value });
    }

    occupationRows.push({
      soc_code: occ.soc_code,
      title: occ.title,
      description: occ.description ?? null,
      job_zone: occ.job_zone ?? null,
      classification_status: "accepted",
      bright_outlook: extra.bright_outlook ?? null,
      green_occupation: extra.green_occupation ?? null,
      median_salary: extra.median_salary ?? null,
      release_id: release.id,
      release_version: release.version_label,
      riasec_vector: vecs.riasec ?? null,
      profile_v1_vector: vecs.profile_v1 ?? null,
      holland_codes: interestOi.map((i) => i.holland_code).filter(Boolean),
      interest_scores: interestOi
    });
  }

  for (const r of ratings) {
    if (!acceptedSocSet.has(r.soc_code)) continue;
    const el = elementsById.get(r.element_id);
    const domain = resolveExportDomain(r.element_id, r.element_name, el?.domain);
    const base = {
      soc_code: r.soc_code,
      occupation_title: occBySoc.get(r.soc_code)?.title ?? null,
      element_id: r.element_id,
      element_name: r.element_name ?? el?.element_name ?? null,
      scale_id: r.scale_id,
      scale_name: r.scale_name ?? null,
      data_value: r.data_value,
      importance: r.scale_id === SCALE.IMPORTANCE ? r.data_value : null,
      level: r.scale_id === SCALE.LEVEL ? r.data_value : null
    };

    if (domain === "ability") abilitiesRows.push({ ...base, category: categorizeAbility(r.element_id) });
    else if (domain === "interest") {
      interestsRows.push({
        ...base,
        holland_code: hollandCodeForInterest(r.element_name),
        riasec_name: r.element_name
      });
    } else if (domain === "knowledge") knowledgeRows.push(base);
    else if (domain === "skill") skillsRows.push({ ...base, skill_category: categorizeSkill(r.element_name) });
    else if (domain === "work_style") workStylesRows.push(base);
    else if (domain === "work_value") workValuesRows.push(base);
    else if (domain === "work_activity") {
      workActivitiesRows.push(base);
      if (r.scale_id === SCALE.IMPORTANCE) {
        competenciesRows.push({
          soc_code: r.soc_code,
          occupation_title: base.occupation_title,
          work_activity_id: r.element_id,
          work_activity_name: r.element_name,
          competency_score: r.data_value,
          scale_id: r.scale_id
        });
      }
    } else if (domain === "work_context") workContextRows.push(base);
  }

  const alternateTitleRows = alternateTitles
    .filter((t) => acceptedSocSet.has(t.soc_code))
    .map((t) => ({
      soc_code: t.soc_code,
      occupation_title: occBySoc.get(t.soc_code)?.title ?? null,
      alternate_title: t.title,
      short_title: t.short_title ?? null,
      source_type: t.source_type ?? null,
      synonym: t.title
    }));

  const relatedRows = related
    .filter((r) => acceptedSocSet.has(r.soc_code) && acceptedSocSet.has(r.related_soc_code))
    .map((r) => ({
      soc_code: r.soc_code,
      occupation_title: occBySoc.get(r.soc_code)?.title ?? null,
      related_soc_code: r.related_soc_code,
      related_title: r.related_title ?? null,
      relatedness_tier: r.relatedness_tier ?? null,
      match_index: r.match_index ?? null
    }));

  const technologyRows = technologySkills
    .filter((t) => acceptedSocSet.has(t.soc_code))
    .map((t) => ({
      soc_code: t.soc_code,
      occupation_title: occBySoc.get(t.soc_code)?.title ?? null,
      example: t.example,
      commodity_code: t.commodity_code ?? null,
      commodity_title: t.commodity_title ?? null,
      hot_technology: t.hot_technology ?? false,
      in_demand: t.in_demand ?? false,
      category: inferTechCategory(t.commodity_title, t.example)
    }));

  const vectorRows = vectors
    .filter((v) => acceptedSocSet.has(v.soc_code))
    .map((v) => ({
      soc_code: v.soc_code,
      vector_type: v.vector_type,
      vector_json: JSON.stringify(v.vector)
    }));

  const embeddingRows = embeddings
    .filter((e) => acceptedSocSet.has(e.soc_code))
    .map((e) => ({
      soc_code: e.soc_code,
      model_version: e.model_version,
      embedding_json: e.embedding ? JSON.stringify(e.embedding) : null
    }));

  const taskStatements = (excelExtras?.taskStatements ?? []).filter((t) =>
    acceptedSocSet.has(t.soc_code)
  );
  const emergingTasks = (excelExtras?.emergingTasks ?? []).filter((t) =>
    acceptedSocSet.has(t.soc_code)
  );
  const taskRatings = (excelExtras?.taskRatings ?? []).filter((t) => acceptedSocSet.has(t.soc_code));
  const educationRows = (excelExtras?.education ?? []).filter((t) => acceptedSocSet.has(t.soc_code));
  const toolsRows = (excelExtras?.toolsUsed ?? []).filter((t) => acceptedSocSet.has(t.soc_code));

  const masterOccupations = occupationRows.map((o) => {
    const soc = o.soc_code;
    return {
      ...o,
      alternate_titles: alternateTitleRows.filter((a) => a.soc_code === soc).map((a) => a.alternate_title),
      abilities: abilitiesRows.filter((a) => a.soc_code === soc),
      interests: interestsRows.filter((i) => i.soc_code === soc),
      knowledge: knowledgeRows.filter((k) => k.soc_code === soc),
      skills: skillsRows.filter((s) => s.soc_code === soc),
      work_styles: workStylesRows.filter((w) => w.soc_code === soc),
      work_values: workValuesRows.filter((w) => w.soc_code === soc),
      work_activities: workActivitiesRows.filter((w) => w.soc_code === soc),
      work_context: workContextRows.filter((w) => w.soc_code === soc),
      related_occupations: relatedRows.filter((r) => r.soc_code === soc),
      technology_skills: technologyRows.filter((t) => t.soc_code === soc)
    };
  });

  return {
    occupationRows,
    masterOccupations,
    alternateTitleRows,
    abilitiesRows,
    interestsRows,
    knowledgeRows,
    skillsRows,
    educationRows,
    taskStatements,
    emergingTasks,
    taskRatings,
    technologyRows,
    toolsRows,
    workActivitiesRows,
    workContextRows,
    workStylesRows,
    workValuesRows,
    competenciesRows,
    relatedRows,
    vectorRows,
    embeddingRows
  };
};

const categorizeAbility = (elementId) => {
  const id = String(elementId || "");
  if (id.startsWith("1.A.1.a")) return "cognitive";
  if (id.startsWith("1.A.1.b")) return "psychomotor";
  if (id.startsWith("1.A.2")) return "physical";
  return "general";
};

const categorizeSkill = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("basic") || n.includes("reading") || n.includes("writing") || n.includes("mathematics")) {
    return "basic";
  }
  return "cross_functional";
};

const inferTechCategory = (commodity, example) => {
  const text = `${commodity || ""} ${example || ""}`.toLowerCase();
  if (/software|application|program/i.test(text)) return "software";
  if (/framework|library/i.test(text)) return "framework";
  if (/platform|cloud|database/i.test(text)) return "platform";
  return "technical_competency";
};

export const buildIndexes = (accepted, datasets) => {
  const bySoc = {};
  const byTitle = {};
  for (const o of accepted) {
    bySoc[o.soc_code] = {
      title: o.title,
      job_zone: o.job_zone ?? null,
      alternate_title_count: datasets.alternateTitleRows.filter((a) => a.soc_code === o.soc_code).length,
      rating_count: [
        datasets.abilitiesRows,
        datasets.interestsRows,
        datasets.knowledgeRows,
        datasets.skillsRows
      ].reduce((n, arr) => n + arr.filter((r) => r.soc_code === o.soc_code).length, 0)
    };
    byTitle[o.title.toLowerCase()] = o.soc_code;
  }
  return { by_soc: bySoc, by_title: byTitle };
};

export const buildRelationshipMaps = (datasets, acceptedSocSet) => {
  const socToRelated = {};
  const socToTech = {};
  for (const r of datasets.relatedRows) {
    if (!socToRelated[r.soc_code]) socToRelated[r.soc_code] = [];
    socToRelated[r.soc_code].push(r.related_soc_code);
  }
  for (const t of datasets.technologyRows) {
    if (!socToTech[t.soc_code]) socToTech[t.soc_code] = [];
    socToTech[t.soc_code].push(t.example);
  }
  const orphanedRelated = datasets.relatedRows.filter((r) => !acceptedSocSet.has(r.related_soc_code));
  return { soc_to_related: socToRelated, soc_to_technology: socToTech, orphaned_related: orphanedRelated };
};

export const RIASEC_LABELS = Object.keys(ONET_INTEREST_TO_RIASEC);
