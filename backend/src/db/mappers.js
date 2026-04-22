const metaFromOptions = (row) => {
  const opts = Array.isArray(row.options) ? row.options : [];
  const first = opts[0] && typeof opts[0] === "object" ? opts[0] : {};
  return first;
};

export const mapQuestionRow = (row) => {
  if (!row) return null;
  const opt0 = metaFromOptions(row);
  return {
    _id: row.id,
    id: row.id,
    category: row.category,
    stem: row.stem,
    bigFiveKey: row.big_five_key,
    riasecKey: row.riasec_key ?? opt0.riasecKey ?? null,
    likertReverse: row.likert_reverse ?? opt0.likertReverse ?? false,
    useLikert: row.use_likert,
    options: Array.isArray(row.options) ? row.options : [],
    order: row.sort_order,
    active: row.active,
    externalCode: row.external_code ?? null,
    flowRules: row.flow_rules && typeof row.flow_rules === "object" ? row.flow_rules : {},
    assessmentKeys: Array.isArray(row.assessment_keys) ? row.assessment_keys : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

function resolveIntakeProfile(row) {
  const col = row.intake_profile && typeof row.intake_profile === "object" ? row.intake_profile : {};
  const ss = row.session_state && typeof row.session_state === "object" ? row.session_state : {};
  const fromSs = ss.intake && typeof ss.intake === "object" ? ss.intake : {};
  if (col.savedAt) return { ...fromSs, ...col };
  if (fromSs.savedAt) return fromSs;
  return { ...fromSs, ...col };
}

export const mapAttemptRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    assessmentKey: row.assessment_key ?? "career_g11",
    sessionState: row.session_state && typeof row.session_state === "object" ? row.session_state : {},
    intakeProfile: resolveIntakeProfile(row),
    status: row.status,
    responses: row.responses ?? [],
    scores: row.scores ?? undefined,
    profileVector: row.profile_vector ?? [],
    careerMatches: row.career_matches ?? [],
    submittedAt: row.submitted_at,
    scoredAt: row.scored_at,
    writingEvaluation: row.writing_evaluation,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const mapReportRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    attemptId: row.attempt_id,
    structuredSummary: row.structured_summary,
    aiNarrative: row.ai_narrative,
    skillGaps: row.skill_gaps ?? [],
    topCareers: row.top_careers ?? [],
    writingEvaluation: row.writing_evaluation,
    aiProvider: row.ai_provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const bodyToQuestionInsert = (body) => {
  let options = Array.isArray(body.options) ? body.options : [];
  if (body.category === "big5" && body.useLikert && options.length === 0) {
    options = [{ likertReverse: !!body.likertReverse }];
  }
  if (body.category === "riasec" && body.useLikert && options.length === 0 && body.riasecKey) {
    options = [{ riasecKey: body.riasecKey }];
  }
  return {
    category: body.category,
    stem: body.stem,
    big_five_key: body.bigFiveKey ?? null,
    use_likert: body.useLikert ?? false,
    options,
    sort_order: body.order ?? 0,
    active: body.active !== false
  };
};

export const bodyToQuestionPatch = (body) => {
  const patch = {};
  if (body.category !== undefined) patch.category = body.category;
  if (body.stem !== undefined) patch.stem = body.stem;
  if (body.bigFiveKey !== undefined) patch.big_five_key = body.bigFiveKey;
  if (body.useLikert !== undefined) patch.use_likert = body.useLikert;
  if (body.options !== undefined) patch.options = body.options;
  if (body.order !== undefined) patch.sort_order = body.order;
  if (body.active !== undefined) patch.active = body.active;
  patch.updated_at = new Date().toISOString();
  return patch;
};
