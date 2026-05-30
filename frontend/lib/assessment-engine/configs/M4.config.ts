import type { LikertModuleConfig } from "./module-config.types";
import { FREQ_5 } from "./shared-likert-scales";

/** M4 — Herzberg two-factor (hygiene vs motivators) */
export const M4_CONFIG: LikertModuleConfig = {
  moduleId: "M04",
  engineType: "likert",
  title: "Herzberg Hygiene",
  estimatedMinutes: 8,
  scoring: {
    provider: "rule",
    constructs: ["HERZBERG", "HYGIENE", "MOTIVATOR", "JOB_SATISFACTION"]
  },
  fastResponseMs: 5500,
  hesitationMs: 11000,
  checkpointInterval: 4,
  items: [
    {
      id: "M4-F01",
      type: "frequency",
      category: "hygiene_factors",
      prompt: "How often does unfair pay or benefits make you seriously consider leaving a role?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["hygiene", "compensation"],
      scoringWeight: { hygiene_factors: 1, intrinsic_extrinsic: 0.4 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M4-F02",
      type: "frequency",
      category: "hygiene_factors",
      prompt: "How often do poor working conditions (noise, safety, tools) drain your motivation?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["hygiene", "environment"],
      scoringWeight: { hygiene_factors: 1, safety_security: 0.5 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M4-F03",
      type: "frequency",
      category: "hygiene_factors",
      prompt: "How often does ambiguous supervision or unclear expectations frustrate you?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["hygiene", "supervision"],
      scoringWeight: { hygiene_factors: 1, autonomy: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M4-B01",
      type: "binary",
      category: "hygiene_factors",
      prompt: "If workplace policies feel arbitrary or inconsistent, does that affect your commitment strongly?",
      binaryLabels: ["Minor annoyance", "Major demotivator"],
      difficulty: 2,
      telemetryTags: ["hygiene", "policy"],
      scoringWeight: { hygiene_factors: 1, emotional_resilience: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M4-SD01",
      type: "semantic_differential",
      category: "hygiene_factors",
      prompt: "When basic job conditions are poor, you feel…",
      poles: ["Still engaged by the work", "Quickly disengaged"],
      difficulty: 2,
      telemetryTags: ["hygiene", "engagement"],
      scoringWeight: { hygiene_factors: 1, job_satisfaction: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M4-F04",
      type: "frequency",
      category: "motivator_factors",
      prompt: "How often does meaningful responsibility increase your commitment to a role?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["motivator", "responsibility"],
      scoringWeight: { motivator_factors: 1, achievement_orientation: 0.5 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M4-F05",
      type: "frequency",
      category: "motivator_factors",
      prompt: "How often does recognition for genuine accomplishment energise you for weeks?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["motivator", "recognition"],
      scoringWeight: { motivator_factors: 1, recognition: 0.8 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M4-F06",
      type: "frequency",
      category: "motivator_factors",
      prompt: "How often does personal growth within a role matter more than a title change?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["motivator", "growth"],
      scoringWeight: { motivator_factors: 1, growth_motivation: 0.7 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M4-B02",
      type: "binary",
      category: "motivator_factors",
      prompt: "Would you stay in a well-paid but unchallenging role for more than a year?",
      binaryLabels: ["Yes, likely", "No, I'd leave"],
      difficulty: 2,
      telemetryTags: ["motivator", "challenge"],
      scoringWeight: { motivator_factors: 1, challenge_tolerance: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M4-SD02",
      type: "semantic_differential",
      category: "job_satisfaction",
      prompt: "Your overall job satisfaction depends more on…",
      poles: ["Removing frustrations", "Adding meaningful work"],
      difficulty: 3,
      telemetryTags: ["herzberg", "satisfaction"],
      scoringWeight: { job_satisfaction: 1, motivator_factors: 0.5, hygiene_factors: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M4-F07",
      type: "frequency",
      category: "job_satisfaction",
      prompt: "How often do you feel genuinely satisfied when both conditions and growth are strong?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["satisfaction", "combined"],
      scoringWeight: { job_satisfaction: 1, motivator_factors: 0.4, hygiene_factors: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M4-SD03",
      type: "semantic_differential",
      category: "motivator_factors",
      prompt: "When your work has visible impact, you feel…",
      poles: ["Neutral", "Deeply fulfilled"],
      difficulty: 2,
      telemetryTags: ["motivator", "impact"],
      scoringWeight: { motivator_factors: 1, long_term_ambition: 0.4 },
      adaptiveTags: ["complex"]
    }
  ]
};
