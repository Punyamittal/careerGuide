import type { LikertModuleConfig } from "./module-config.types";
import { FREQ_5 } from "./shared-likert-scales";

/** M7 — Weiner attribution style (locus, stability, controllability) */
export const M7_CONFIG: LikertModuleConfig = {
  moduleId: "M07",
  engineType: "likert",
  title: "Attribution Style",
  estimatedMinutes: 8,
  scoring: {
    provider: "rule",
    constructs: ["ATTRIBUTION", "LOCUS_OF_CONTROL", "EXPLANATORY_STYLE"]
  },
  fastResponseMs: 5500,
  hesitationMs: 11000,
  checkpointInterval: 4,
  items: [
    {
      id: "M7-F01",
      type: "frequency",
      category: "internal_attribution",
      prompt: "When you succeed, how often do you credit your own effort and choices?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["attribution", "success_internal"],
      scoringWeight: { internal_attribution: 1, achievement_orientation: 0.5 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M7-F02",
      type: "frequency",
      category: "external_attribution",
      prompt: "When you fail, how often do you blame luck, timing, or other people?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["attribution", "failure_external"],
      scoringWeight: { external_attribution: 1, emotional_resilience: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M7-B01",
      type: "binary",
      category: "internal_attribution",
      prompt: "After a poor grade or review, do you first ask what you could do differently?",
      binaryLabels: ["Blame circumstances", "Ask what I can change"],
      difficulty: 2,
      telemetryTags: ["attribution", "failure_internal"],
      scoringWeight: { internal_attribution: 1, learning_behavior: 0.6 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M7-SD01",
      type: "semantic_differential",
      category: "locus_of_control",
      prompt: "Your outcomes in life feel mostly controlled by…",
      poles: ["External forces", "Your own actions"],
      difficulty: 2,
      telemetryTags: ["attribution", "locus"],
      scoringWeight: { locus_of_control: 1, internal_attribution: 0.7 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M7-F03",
      type: "frequency",
      category: "external_attribution",
      prompt: "How often do you feel that bias or unfair systems explain setbacks better than personal effort?",
      scaleLabels: [...FREQ_5],
      difficulty: 3,
      telemetryTags: ["attribution", "systemic"],
      scoringWeight: { external_attribution: 1, perceived_fairness: 0.4 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M7-F04",
      type: "frequency",
      category: "internal_attribution",
      prompt: "How often do you believe you can improve a bad situation with sustained effort?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["attribution", "effort"],
      scoringWeight: { internal_attribution: 1, growth_motivation: 0.6 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M7-SD02",
      type: "semantic_differential",
      category: "locus_of_control",
      prompt: "When something goes wrong repeatedly, you assume the cause is…",
      poles: ["Permanent & unchangeable", "Temporary & fixable"],
      difficulty: 3,
      telemetryTags: ["attribution", "stability"],
      scoringWeight: { locus_of_control: 1, emotional_resilience: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M7-B02",
      type: "binary",
      category: "external_attribution",
      prompt: "If a team project fails, is your first instinct to identify who else contributed to the problem?",
      binaryLabels: ["Yes, often", "Focus on team/system"],
      difficulty: 2,
      telemetryTags: ["attribution", "blame"],
      scoringWeight: { external_attribution: 1, collaboration_independence: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M7-F05",
      type: "frequency",
      category: "locus_of_control",
      prompt: "How often do you revisit past failures to update your explanation of what happened?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["attribution", "reflection"],
      scoringWeight: { locus_of_control: 1, learning_behavior: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M7-SD03",
      type: "semantic_differential",
      category: "internal_attribution",
      prompt: "When praised for success, you tend to feel…",
      poles: ["Lucky this time", "Earned through ability"],
      difficulty: 2,
      telemetryTags: ["attribution", "success"],
      scoringWeight: { internal_attribution: 1, recognition: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M7-F06",
      type: "frequency",
      category: "external_attribution",
      prompt: "How often do you discount positive feedback as politeness rather than genuine assessment?",
      scaleLabels: [...FREQ_5],
      difficulty: 3,
      telemetryTags: ["attribution", "discounting"],
      scoringWeight: { external_attribution: 1, feedback_response: 0.4 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M7-B03",
      type: "binary",
      category: "locus_of_control",
      prompt: "Do you generally expect that preparation increases your odds of success?",
      binaryLabels: ["Not strongly", "Yes, clearly"],
      difficulty: 1,
      telemetryTags: ["attribution", "expectancy"],
      scoringWeight: { locus_of_control: 1, expectancy_belief: 0.6 },
      adaptiveTags: ["simple"]
    }
  ]
};
