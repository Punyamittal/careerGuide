import type {
  EmotionId,
  EmotionalToneId,
  EventDomainId,
  EventTypeId,
  ImpactDimensionId,
  LifeStageId,
  ReflectionLensId
} from "./types";

export const LIFE_STAGES: { id: LifeStageId; label: string; hint: string }[] = [
  { id: "childhood", label: "Childhood", hint: "Early memories & family patterns" },
  { id: "primary_school", label: "Primary School", hint: "Foundations & first social worlds" },
  { id: "middle_school", label: "Middle School", hint: "Identity starts forming" },
  { id: "late_school", label: "Late School", hint: "Pressure, choices & belonging" },
  { id: "college", label: "College", hint: "Exploration & independence" },
  { id: "early_career", label: "Early Career", hint: "First roles & real-world stakes" },
  { id: "current_phase", label: "Current Phase", hint: "What is shaping you now" },
  { id: "not_sure", label: "Not Sure", hint: "Timeline unclear — still valid" }
];

export const EVENT_TYPES: { id: EventTypeId; label: string; description: string }[] = [
  {
    id: "first_time",
    label: "First-time / memorable moment",
    description: "Something you remember clearly because it happened for the first time."
  },
  {
    id: "repeated",
    label: "Repeated situation",
    description: "Something that happened many times and shaped you slowly."
  },
  {
    id: "life_changing",
    label: "Life-changing event",
    description: "Something that changed your confidence, path, family, health, money, or future."
  },
  {
    id: "special",
    label: "Special event",
    description: "Something emotional, symbolic, painful, rare, or deeply meaningful."
  }
];

export const EVENT_DOMAINS: { id: EventDomainId; label: string; emoji: string }[] = [
  { id: "relationships", label: "Relationships", emoji: "🤝" },
  { id: "situation", label: "Situation / Environment", emoji: "🌍" },
  { id: "ksa", label: "Knowledge, Skills & Abilities", emoji: "🧠" },
  { id: "health_energy", label: "Health / Energy", emoji: "💚" },
  { id: "money_opportunity", label: "Money / Opportunity", emoji: "💰" },
  { id: "identity_confidence", label: "Identity / Confidence", emoji: "✨" },
  { id: "career_education", label: "Career / Education", emoji: "🎓" },
  { id: "values_philosophy", label: "Values / Philosophy", emoji: "🧭" }
];

export const SUBCATEGORIES: Record<EventDomainId, string[]> = {
  relationships: [
    "Parents",
    "Siblings",
    "Friends",
    "Teacher / Mentor",
    "Boss / Team Lead",
    "Romantic Partner",
    "Public / Society",
    "Authority Figure",
    "Rival / Enemy"
  ],
  situation: [
    "General Life Situation",
    "Casual Moment",
    "Negative Situation",
    "Conflict",
    "Comparison",
    "Failure",
    "Achievement",
    "Social Pressure",
    "Discrimination",
    "Transition",
    "Institutional Politics"
  ],
  ksa: [
    "Knowledge Learned",
    "Skill Gained",
    "Skill Failed To Develop",
    "Ability Discovered",
    "Ability Doubted",
    "Talent Recognized",
    "Talent Ignored",
    "Learning Difficulty",
    "Performance Pressure",
    "Leadership / Teamwork"
  ],
  health_energy: [
    "Physical Health",
    "Mental Wellbeing",
    "Sleep / Energy",
    "Burnout / Exhaustion",
    "Injury / Illness",
    "Recovery / Healing"
  ],
  money_opportunity: [
    "Financial Pressure",
    "Family Resources",
    "Scholarship / Aid",
    "Job / Income",
    "Loss / Debt",
    "Unexpected Opportunity"
  ],
  identity_confidence: [
    "Self-image",
    "Belonging",
    "Courage / Voice",
    "Shame / Doubt",
    "Public Identity",
    "Inner Critic"
  ],
  career_education: [
    "Subject Choice",
    "Exams / Results",
    "Internship / Work",
    "Mentor / Guide",
    "Stream / Major Decision",
    "Career Pivot"
  ],
  values_philosophy: [
    "Beliefs",
    "Culture / Religion",
    "Purpose",
    "Ethics",
    "Worldview Shift",
    "Role Models"
  ]
};

/** Searchable event library keyed by domain (MBS narrative bank — exploratory, non-diagnostic). */
export const EVENT_LIBRARY: Record<EventDomainId, string[]> = {
  relationships: [
    "I felt deeply supported by someone",
    "I had conflict with authority",
    "I lost trust in someone close",
    "I found a mentor",
    "I felt excluded by a group",
    "I became the caregiver in my family",
    "I learned to set boundaries"
  ],
  situation: [
    "I was compared with someone",
    "I was praised publicly",
    "I was humiliated publicly",
    "I changed school or city",
    "I faced social pressure",
    "I experienced discrimination",
    "I navigated institutional politics",
    "I went through a major transition"
  ],
  ksa: [
    "I failed an important exam",
    "I discovered a talent",
    "I was told I was not good enough",
    "I mastered a difficult skill",
    "I avoided learning something hard",
    "I led a team for the first time",
    "I struggled with performance pressure"
  ],
  health_energy: [
    "I burned out",
    "I recovered from illness",
    "I learned to manage stress",
    "My energy crashed during exams",
    "I started prioritizing wellbeing"
  ],
  money_opportunity: [
    "I faced financial pressure",
    "My family could not afford something important",
    "I received a scholarship or grant",
    "I lost an economic opportunity",
    "I became financially independent"
  ],
  identity_confidence: [
    "I discovered who I want to be",
    "I hid part of myself",
    "I spoke up for the first time",
    "I felt ashamed of myself",
    "I rebuilt my self-image"
  ],
  career_education: [
    "I chose a stream or major",
    "I failed an important exam",
    "I found a career direction",
    "I felt lost about my future",
    "I had an internship that changed my view",
    "I changed career path"
  ],
  values_philosophy: [
    "My beliefs were challenged",
    "I found a sense of purpose",
    "I questioned what success means",
    "I adopted a new philosophy",
    "I distanced from family expectations"
  ]
};

/** Universal events shown for every domain */
export const UNIVERSAL_EVENTS = [
  "I was compared with someone",
  "I was praised publicly",
  "I was humiliated publicly",
  "I failed an important exam",
  "I discovered a talent",
  "I changed school or city",
  "I faced financial pressure",
  "I felt excluded socially",
  "I found a mentor",
  "I had conflict with authority",
  "I learned to speak up",
  "I avoided risks",
  "I became more ambitious"
];

export const IMPACT_DIMENSIONS: { id: ImpactDimensionId; label: string }[] = [
  { id: "confidence", label: "Confidence" },
  { id: "identity", label: "Identity" },
  { id: "direction", label: "Direction" },
  { id: "capability", label: "Capability" },
  { id: "risk_taking", label: "Risk-taking" },
  { id: "belonging", label: "Belonging" },
  { id: "money_mindset", label: "Money Mindset" },
  { id: "energy", label: "Energy" },
  { id: "opportunity_access", label: "Opportunity Access" },
  { id: "meaning_purpose", label: "Meaning / Purpose" }
];

export const INTENSITY_LABELS: Record<number, string> = {
  1: "Small Effect",
  2: "Some Effect",
  3: "Clear Effect",
  4: "Major Effect",
  5: "Life-changing"
};

export const EMOTIONS: { id: EmotionId; label: string }[] = [
  { id: "proud", label: "Proud" },
  { id: "happy", label: "Happy" },
  { id: "excited", label: "Excited" },
  { id: "confused", label: "Confused" },
  { id: "embarrassed", label: "Embarrassed" },
  { id: "angry", label: "Angry" },
  { id: "afraid", label: "Afraid" },
  { id: "hurt", label: "Hurt" },
  { id: "motivated", label: "Motivated" },
  { id: "pressured", label: "Pressured" },
  { id: "inspired", label: "Inspired" },
  { id: "lonely", label: "Lonely" },
  { id: "relieved", label: "Relieved" },
  { id: "guilty", label: "Guilty" },
  { id: "grateful", label: "Grateful" }
];

export const EMOTIONAL_TONES: { id: EmotionalToneId; label: string }[] = [
  { id: "hopeful", label: "Hopeful" },
  { id: "difficult", label: "Difficult" },
  { id: "neutral", label: "Neutral" },
  { id: "mixed", label: "Mixed" },
  { id: "transformative", label: "Transformative" }
];

export const REFLECTION_LENSES: { id: ReflectionLensId; label: string }[] = [
  { id: "positive", label: "Positive" },
  { id: "negative", label: "Negative" },
  { id: "mixed", label: "Mixed" },
  { id: "learned", label: "I Learned From It" },
  { id: "still_affects", label: "Still Affects Me" },
  { id: "unknown", label: "I Don't Know" }
];

export const STAGE_ORDER: LifeStageId[] = LIFE_STAGES.map((s) => s.id);

export function labelForStage(id: LifeStageId) {
  return LIFE_STAGES.find((s) => s.id === id)?.label ?? id;
}

export function labelForDomain(id: EventDomainId) {
  return EVENT_DOMAINS.find((d) => d.id === id)?.label ?? id;
}
