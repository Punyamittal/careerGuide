/** Life Journey — structured narrative intelligence types (MBS-aligned signals). */

export type LifeStageId =
  | "childhood"
  | "primary_school"
  | "middle_school"
  | "late_school"
  | "college"
  | "early_career"
  | "current_phase"
  | "not_sure";

export type EventTypeId =
  | "first_time"
  | "repeated"
  | "life_changing"
  | "special";

export type EventDomainId =
  | "relationships"
  | "situation"
  | "ksa"
  | "health_energy"
  | "money_opportunity"
  | "identity_confidence"
  | "career_education"
  | "values_philosophy";

export type ImpactDimensionId =
  | "confidence"
  | "identity"
  | "direction"
  | "capability"
  | "risk_taking"
  | "belonging"
  | "money_mindset"
  | "energy"
  | "opportunity_access"
  | "meaning_purpose";

export type EmotionId =
  | "proud"
  | "happy"
  | "excited"
  | "confused"
  | "embarrassed"
  | "angry"
  | "afraid"
  | "hurt"
  | "motivated"
  | "pressured"
  | "inspired"
  | "lonely"
  | "relieved"
  | "guilty"
  | "grateful";

export type ReflectionLensId =
  | "positive"
  | "negative"
  | "mixed"
  | "learned"
  | "still_affects"
  | "unknown";

/** Optional tone for custom events (step 5). */
export type EmotionalToneId =
  | "hopeful"
  | "difficult"
  | "neutral"
  | "mixed"
  | "transformative";

export type PsychologicalSignalId =
  | "confidence"
  | "resilience"
  | "ambition"
  | "social_trust"
  | "risk_tolerance"
  | "perfectionism"
  | "adaptability"
  | "validation_seeking"
  | "independence"
  | "belonging"
  | "emotional_sensitivity";

/** MBS construct tags for backend / reporting (non-clinical). */
export type MbsConstructTag =
  | "BIG5"
  | "ATTRIBUTION"
  | "SOCIAL_COMPARISON"
  | "MCCLELLAND"
  | "DWECK"
  | "LEWIN_BPE"
  | "SENSE_MEANING"
  | "GRIT"
  | "EQ";

export type SignalContribution = {
  signal: PsychologicalSignalId;
  weight: number;
  mbsConstructs?: MbsConstructTag[];
};

export type LifeEventRecord = {
  id: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  lifeStage: LifeStageId;
  eventType: EventTypeId;
  domain: EventDomainId;
  subcategory: string;
  eventLabel: string;
  customEvent?: boolean;
  customDescription?: string;
  emotionalTone?: EmotionalToneId;
  impacts: ImpactDimensionId[];
  intensity: 1 | 2 | 3 | 4 | 5;
  emotions: EmotionId[];
  reflectionLens: ReflectionLensId;
  signalMap: SignalContribution[];
  /** MBS-style slugs for reporting / future AI (non-clinical). */
  behavioralSignals?: string[];
  notes?: string;
};

export type GrowthArc = {
  id: string;
  title: string;
  summary: string;
  relatedSignals: PsychologicalSignalId[];
  confidence: "low" | "medium" | "high";
};

export type AggregatedSignal = {
  signal: PsychologicalSignalId;
  score: number;
  eventCount: number;
  label: string;
};

export type JourneyInsight = {
  id: string;
  text: string;
  category: "pattern" | "strength" | "exploration" | "career";
  relatedSignals: PsychologicalSignalId[];
  confidence: "low" | "medium" | "high";
};

export type CareerInfluenceSummary = {
  headline: string;
  bullets: string[];
  suggestedExplorations: string[];
};
