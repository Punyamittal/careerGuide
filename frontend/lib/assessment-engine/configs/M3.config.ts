import type { LikertModuleConfig } from "./module-config.types";

/** M3 — Dweck Mindset (config-only; reuses Likert engine) */
export const M3_CONFIG: LikertModuleConfig = {
  moduleId: "M03",
  engineType: "likert",
  title: "Dweck Mindset",
  estimatedMinutes: 5,
  scoring: {
    provider: "rule",
    constructs: ["DWECK", "MOTIVATION"]
  },
  fastResponseMs: 5500,
  hesitationMs: 11000,
  items: [
    {
      id: "M3-F01",
      type: "frequency",
      category: "growth_motivation",
      prompt: "How often do you believe your abilities can grow significantly with effort and practice?",
      scaleLabels: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
      difficulty: 1,
      telemetryTags: ["growth_mindset"],
      scoringWeight: { growth_motivation: 1, learning_behavior: 0.5 },
      adaptiveTags: ["simple"],
      idealIndex: 5
    },
    {
      id: "M3-SD01",
      type: "semantic_differential",
      category: "challenge_tolerance",
      prompt: "When you face a difficult task, you feel…",
      poles: ["Like giving up", "Curious to learn"],
      difficulty: 2,
      telemetryTags: ["challenge_response"],
      scoringWeight: { challenge_tolerance: 1, growth_motivation: 0.5 },
      adaptiveTags: ["complex"],
      idealIndex: 5
    },
    {
      id: "M3-SD02",
      type: "semantic_differential",
      category: "feedback_response",
      prompt: "When you make a mistake, you tend to feel…",
      poles: ["Ashamed and stuck", "Motivated to improve"],
      difficulty: 2,
      telemetryTags: ["error_response"],
      scoringWeight: { feedback_response: 1, emotional_resilience: 0.4 },
      adaptiveTags: ["complex"],
      idealIndex: 5
    },
    {
      id: "M3-B01",
      type: "binary",
      category: "learning_behavior",
      prompt: "Do you usually seek feedback even when it might be critical?",
      binaryLabels: ["Avoid it", "Welcome it"],
      difficulty: 1,
      telemetryTags: ["feedback_orientation"],
      scoringWeight: { learning_behavior: 1, feedback_response: 0.6 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M3-F02",
      type: "frequency",
      category: "learning_behavior",
      prompt: "How often do you try new strategies when your first approach does not work?",
      scaleLabels: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
      difficulty: 3,
      telemetryTags: ["strategy_flexibility"],
      scoringWeight: { learning_behavior: 1, curiosity: 0.4 },
      adaptiveTags: ["complex"],
      idealIndex: 4
    }
  ]
};
