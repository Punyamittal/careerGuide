import type { LikertModuleConfig } from "./module-config.types";
import { FREQ_5 } from "./shared-likert-scales";

/** M2 — McClelland Needs (achievement, affiliation, power) */
export const M2_CONFIG: LikertModuleConfig = {
  moduleId: "M02",
  engineType: "likert",
  title: "McClelland Needs",
  estimatedMinutes: 8,
  scoring: {
    provider: "rule",
    constructs: ["MCCLELLAND", "ACHIEVEMENT", "AFFILIATION", "POWER"]
  },
  fastResponseMs: 5500,
  hesitationMs: 11000,
  checkpointInterval: 4,
  checkpoints: [
    {
      afterIndex: 4,
      message: "You're mapping what drives you — keep answering instinctively."
    },
    {
      afterIndex: 8,
      message: "Almost done with your needs profile."
    }
  ],
  items: [
    {
      id: "M2-F01",
      type: "frequency",
      category: "achievement_need",
      prompt: "How often do you set challenging personal standards and push to exceed them?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["nAch", "standards"],
      scoringWeight: { achievement_need: 1, achievement_orientation: 0.5 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M2-F02",
      type: "frequency",
      category: "achievement_need",
      prompt: "How often do you prefer tasks where you can see clear evidence of your progress?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["nAch", "feedback"],
      scoringWeight: { achievement_need: 1, learning_behavior: 0.3 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M2-B01",
      type: "binary",
      category: "achievement_need",
      prompt: "Would you rather take on a difficult project alone than share credit on an easy win?",
      binaryLabels: ["Share the easy win", "Take the hard project"],
      difficulty: 2,
      telemetryTags: ["nAch", "challenge"],
      scoringWeight: { achievement_need: 1, challenge_tolerance: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M2-SD01",
      type: "semantic_differential",
      category: "achievement_need",
      prompt: "When comparing your work to others, you feel…",
      poles: ["Satisfied with participation", "Driven to outperform"],
      difficulty: 2,
      telemetryTags: ["nAch", "comparison"],
      scoringWeight: { achievement_need: 1, achievement_orientation: 0.6 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M2-F03",
      type: "frequency",
      category: "affiliation_need",
      prompt: "How often do you prioritise maintaining harmony in a group over winning an argument?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["nAff", "harmony"],
      scoringWeight: { affiliation_need: 1, collaboration_independence: 0.5 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M2-F04",
      type: "frequency",
      category: "affiliation_need",
      prompt: "How often do you feel energised when people genuinely appreciate and include you?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["nAff", "belonging"],
      scoringWeight: { affiliation_need: 1, social_energy: 0.6 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M2-B02",
      type: "binary",
      category: "affiliation_need",
      prompt: "If a team decision goes against your view, do you usually support the group to preserve relationships?",
      binaryLabels: ["Stand firm publicly", "Support the group"],
      difficulty: 2,
      telemetryTags: ["nAff", "conflict"],
      scoringWeight: { affiliation_need: 1, emotional_resilience: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M2-SD02",
      type: "semantic_differential",
      category: "affiliation_need",
      prompt: "In competitive situations, you tend to feel…",
      poles: ["Concerned about others' feelings", "Focused on winning"],
      difficulty: 2,
      telemetryTags: ["nAff", "competition"],
      scoringWeight: { affiliation_need: 1, collaboration_independence: 0.4 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M2-F05",
      type: "frequency",
      category: "power_need",
      prompt: "How often do you enjoy influencing how a group makes decisions?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["nPow", "influence"],
      scoringWeight: { power_need: 1, achievement_orientation: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M2-F06",
      type: "frequency",
      category: "power_need",
      prompt: "How often do you seek roles where others look to you for direction?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["nPow", "leadership"],
      scoringWeight: { power_need: 1, long_term_ambition: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M2-B03",
      type: "binary",
      category: "power_need",
      prompt: "Would you accept more visibility and accountability if it meant greater control over outcomes?",
      binaryLabels: ["Prefer less visibility", "Accept more control"],
      difficulty: 3,
      telemetryTags: ["nPow", "control"],
      scoringWeight: { power_need: 1, autonomy: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M2-SD03",
      type: "semantic_differential",
      category: "power_need",
      prompt: "When someone challenges your authority or expertise, you feel…",
      poles: ["Open to dialogue", "Motivated to reassert influence"],
      difficulty: 3,
      telemetryTags: ["nPow", "status"],
      scoringWeight: { power_need: 1, emotional_resilience: 0.4 },
      adaptiveTags: ["ambiguous"]
    }
  ]
};
