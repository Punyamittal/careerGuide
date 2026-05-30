/**
 * Backend-ready JSON schemas for Life Journey API (Postgres jsonb / validation).
 * Aligns with MBS Full Toolkit v2 construct feeds (personality, motivation, social lenses).
 */

export const LIFE_EVENT_API_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "LifeJourneyEvent",
  type: "object",
  required: [
    "lifeStage",
    "eventType",
    "domain",
    "subcategory",
    "eventLabel",
    "impacts",
    "intensity",
    "emotions",
    "reflectionLens",
    "signalMap"
  ],
  properties: {
    lifeStage: { type: "string" },
    eventType: { type: "string" },
    domain: { type: "string" },
    subcategory: { type: "string" },
    eventLabel: { type: "string", minLength: 2, maxLength: 500 },
    customEvent: { type: "boolean" },
    impacts: { type: "array", items: { type: "string" }, minItems: 1 },
    intensity: { type: "integer", minimum: 1, maximum: 5 },
    emotions: { type: "array", items: { type: "string" }, minItems: 1 },
    reflectionLens: { type: "string" },
    signalMap: {
      type: "array",
      items: {
        type: "object",
        required: ["signal", "weight"],
        properties: {
          signal: { type: "string" },
          weight: { type: "number", minimum: 0, maximum: 1 },
          mbsConstructs: { type: "array", items: { type: "string" } }
        }
      }
    },
    notes: { type: "string", maxLength: 2000 }
  }
} as const;

export const LIFE_JOURNEY_INSIGHT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    insights: { type: "array" },
    aggregatedSignals: { type: "array" },
    careerSummary: { type: "object" },
    eventCount: { type: "integer" }
  }
} as const;
