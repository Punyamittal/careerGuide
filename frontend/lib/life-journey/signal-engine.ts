import type {
  EmotionId,
  EventDomainId,
  EventTypeId,
  ImpactDimensionId,
  LifeEventRecord,
  PsychologicalSignalId,
  ReflectionLensId,
  SignalContribution
} from "./types";

const SIGNAL_LABELS: Record<PsychologicalSignalId, string> = {
  confidence: "Confidence",
  resilience: "Resilience",
  ambition: "Ambition",
  social_trust: "Social Trust",
  risk_tolerance: "Risk Tolerance",
  perfectionism: "Perfectionism",
  adaptability: "Adaptability",
  validation_seeking: "Validation Seeking",
  independence: "Independence",
  belonging: "Belonging",
  emotional_sensitivity: "Emotional Sensitivity"
};

const impactToSignals: Partial<Record<ImpactDimensionId, PsychologicalSignalId[]>> = {
  confidence: ["confidence", "risk_tolerance"],
  identity: ["independence", "emotional_sensitivity"],
  direction: ["ambition", "adaptability"],
  capability: ["confidence", "perfectionism"],
  risk_taking: ["risk_tolerance", "independence"],
  belonging: ["belonging", "social_trust"],
  money_mindset: ["ambition", "validation_seeking"],
  energy: ["resilience", "emotional_sensitivity"],
  opportunity_access: ["ambition", "adaptability"],
  meaning_purpose: ["independence", "resilience"]
};

const domainToSignals: Partial<Record<EventDomainId, PsychologicalSignalId[]>> = {
  relationships: ["belonging", "social_trust", "emotional_sensitivity"],
  situation: ["adaptability", "validation_seeking", "resilience"],
  ksa: ["confidence", "perfectionism", "ambition"],
  health_energy: ["resilience", "emotional_sensitivity"],
  money_opportunity: ["ambition", "validation_seeking"],
  identity_confidence: ["confidence", "independence"],
  career_education: ["ambition", "direction" as PsychologicalSignalId].filter(Boolean) as PsychologicalSignalId[],
  values_philosophy: ["independence", "meaning_purpose" as PsychologicalSignalId].filter(Boolean) as PsychologicalSignalId[]
};

// fix career_education - direction is impact not signal
domainToSignals.career_education = ["ambition", "adaptability", "confidence"];
domainToSignals.values_philosophy = ["independence", "resilience"];

const eventTypeModifiers: Partial<
  Record<EventTypeId, Partial<Record<PsychologicalSignalId, number>>>
> = {
  repeated: { validation_seeking: 0.15, perfectionism: 0.1, adaptability: 0.1 },
  life_changing: { resilience: 0.2, adaptability: 0.15, emotional_sensitivity: 0.1 },
  special: { emotional_sensitivity: 0.15, belonging: 0.1 }
};

const emotionModifiers: Partial<Record<EmotionId, PsychologicalSignalId[]>> = {
  embarrassed: ["validation_seeking", "emotional_sensitivity"],
  afraid: ["risk_tolerance", "emotional_sensitivity"],
  motivated: ["ambition", "confidence"],
  lonely: ["belonging", "social_trust"],
  inspired: ["ambition", "confidence"]
};

const reflectionModifiers: Partial<
  Record<ReflectionLensId, Partial<Record<PsychologicalSignalId, number>>>
> = {
  still_affects: { emotional_sensitivity: 0.15, resilience: -0.05 },
  learned: { resilience: 0.15, adaptability: 0.1 },
  mixed: { emotional_sensitivity: 0.1 }
};

const eventKeywordSignals: { pattern: RegExp; signals: PsychologicalSignalId[] }[] = [
  { pattern: /compar/i, signals: ["validation_seeking", "perfectionism", "ambition"] },
  { pattern: /mentor|guide|teacher/i, signals: ["social_trust", "confidence", "ambition"] },
  { pattern: /fail|humiliat/i, signals: ["resilience", "perfectionism", "emotional_sensitivity"] },
  { pattern: /talent|master|achiev/i, signals: ["confidence", "ambition"] },
  { pattern: /exclud|lonely|belong/i, signals: ["belonging", "social_trust"] },
  { pattern: /financial|money|scholarship/i, signals: ["ambition", "validation_seeking"] },
  { pattern: /speak up|boundary|courage/i, signals: ["confidence", "independence", "risk_tolerance"] },
  { pattern: /transition|chang(e|ing) school|city|schools frequently/i, signals: ["adaptability", "independence"] },
  { pattern: /pressure|disappoint/i, signals: ["validation_seeking", "perfectionism"] },
  { pattern: /responsib|caregiver/i, signals: ["independence", "emotional_sensitivity"] },
  { pattern: /support|believed in me/i, signals: ["social_trust", "confidence"] },
  { pattern: /lead|team/i, signals: ["confidence", "ambition", "social_trust"] }
];

const subcategorySignals: Partial<Record<string, PsychologicalSignalId[]>> = {
  Parents: ["validation_seeking", "belonging", "emotional_sensitivity"],
  Comparison: ["validation_seeking", "perfectionism"],
  Transition: ["adaptability", "independence"],
  "Exams / Results": ["perfectionism", "ambition", "resilience"],
  "Career Pivot": ["adaptability", "ambition", "confidence"]
};

/** Slugs aligned with MBS / career reporting (non-clinical). */
const keywordToBehavioral: { pattern: RegExp; slugs: string[] }[] = [
  { pattern: /compar/i, slugs: ["comparison_sensitivity", "external_validation", "achievement_pressure"] },
  { pattern: /pressure|disappoint|exam/i, slugs: ["achievement_pressure", "performance_orientation"] },
  { pattern: /talent|achiev|scholarship/i, slugs: ["achievement_orientation", "confidence_growth"] },
  { pattern: /mentor|guide/i, slugs: ["mentorship_influence", "social_learning"] },
  { pattern: /transition|chang(e|ing) school|city|schools frequently/i, slugs: ["adaptability", "social_reset", "independence"] },
  { pattern: /fail|humiliat/i, slugs: ["resilience_building", "setback_processing"] },
  { pattern: /exclud|lonely/i, slugs: ["belonging_need", "social_sensitivity"] },
  { pattern: /responsib|caregiver/i, slugs: ["early_responsibility", "family_role"] },
  { pattern: /lead|team/i, slugs: ["leadership_emergence", "collaboration_style"] },
  { pattern: /discover|purpose|who I want/i, slugs: ["identity_formation", "direction_clarity"] },
  { pattern: /support|believed/i, slugs: ["secure_attachment", "confidence_growth"] },
  { pattern: /conflict with authority/i, slugs: ["authority_relationship", "autonomy_drive"] }
];

/**
 * Maps a life event to psychological signals (MBS-informed, non-clinical).
 * Weights are normalized per event for storage and aggregation.
 */
export function deriveBehavioralSignals(input: {
  eventLabel: string;
  subcategory?: string;
  signalMap: SignalContribution[];
}): string[] {
  const slugs = new Set<string>();

  for (const { pattern, slugs: list } of keywordToBehavioral) {
    if (pattern.test(input.eventLabel)) {
      for (const s of list) slugs.add(s);
    }
  }

  for (const { signal, weight } of input.signalMap) {
    if (weight < 0.12) continue;
    const map: Partial<Record<PsychologicalSignalId, string[]>> = {
      confidence: ["confidence_growth"],
      resilience: ["resilience_building"],
      ambition: ["achievement_orientation"],
      adaptability: ["adaptability"],
      validation_seeking: ["external_validation", "comparison_sensitivity"],
      independence: ["independence", "identity_formation"],
      belonging: ["belonging_need"],
      perfectionism: ["achievement_pressure"]
    };
    for (const s of map[signal] ?? []) slugs.add(s);
  }

  if (input.subcategory && subcategorySignals[input.subcategory]) {
    if (/Parents/i.test(input.subcategory)) slugs.add("family_influence");
    if (/Mentor|Guide/i.test(input.subcategory)) slugs.add("mentorship_influence");
  }

  return [...slugs].slice(0, 8);
}

export function computeEventSignals(input: {
  domain: EventDomainId;
  eventType: EventTypeId;
  eventLabel: string;
  subcategory?: string;
  impacts: ImpactDimensionId[];
  intensity: number;
  emotions: EmotionId[];
  reflectionLens: ReflectionLensId;
  emotionalTone?: string;
}): SignalContribution[] {
  const scores = new Map<PsychologicalSignalId, { w: number; mbs: Set<string> }>();

  const add = (signal: PsychologicalSignalId, delta: number, mbs?: string) => {
    const cur = scores.get(signal) ?? { w: 0, mbs: new Set() };
    cur.w += delta;
    if (mbs) cur.mbs.add(mbs);
    scores.set(signal, cur);
  };

  for (const impact of input.impacts) {
    for (const s of impactToSignals[impact] ?? []) {
      add(s, 0.35, "ATTRIBUTION");
    }
  }

  for (const s of domainToSignals[input.domain] ?? []) {
    add(s, 0.25, "LEWIN_BPE");
  }

  for (const [signal, delta] of Object.entries(eventTypeModifiers[input.eventType] ?? {})) {
    add(signal as PsychologicalSignalId, delta, "SENSE_MEANING");
  }

  for (const em of input.emotions) {
    for (const s of emotionModifiers[em] ?? []) {
      add(s, 0.12, "EQ");
    }
  }

  for (const [signal, delta] of Object.entries(reflectionModifiers[input.reflectionLens] ?? {})) {
    add(signal as PsychologicalSignalId, delta, "DWECK");
  }

  for (const { pattern, signals } of eventKeywordSignals) {
    if (pattern.test(input.eventLabel)) {
      for (const s of signals) add(s, 0.18, "SOCIAL_COMPARISON");
    }
  }

  if (input.subcategory) {
    for (const s of subcategorySignals[input.subcategory] ?? []) {
      add(s, 0.14, "LEWIN_BPE");
    }
  }

  if (input.emotionalTone === "difficult") {
    add("emotional_sensitivity", 0.1, "EQ");
  }
  if (input.emotionalTone === "transformative" || input.emotionalTone === "hopeful") {
    add("resilience", 0.08, "GRIT");
    add("confidence", 0.06, "DWECK");
  }

  const intensityBoost = (input.intensity - 1) * 0.08;
  const results: SignalContribution[] = [];
  let total = 0;
  for (const [signal, { w, mbs }] of scores) {
    const weight = Math.max(0, w + intensityBoost);
    total += weight;
    results.push({
      signal,
      weight,
      mbsConstructs: [...mbs] as SignalContribution["mbsConstructs"]
    });
  }

  if (!total) return results;
  return results
    .map((r) => ({ ...r, weight: Math.round((r.weight / total) * 1000) / 1000 }))
    .sort((a, b) => b.weight - a.weight);
}

export function aggregateSignals(events: LifeEventRecord[]) {
  const totals = new Map<PsychologicalSignalId, { sum: number; count: number }>();

  for (const ev of events) {
    for (const { signal, weight } of ev.signalMap) {
      const cur = totals.get(signal) ?? { sum: 0, count: 0 };
      cur.sum += weight * ev.intensity;
      cur.count += 1;
      totals.set(signal, cur);
    }
  }

  return [...totals.entries()]
    .map(([signal, { sum, count }]) => ({
      signal,
      score: Math.round((sum / count) * 100) / 100,
      eventCount: count,
      label: SIGNAL_LABELS[signal]
    }))
    .sort((a, b) => b.score - a.score);
}

export { SIGNAL_LABELS };
