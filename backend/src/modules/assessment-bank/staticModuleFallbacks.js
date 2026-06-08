/**
 * Static Likert module configs when archive mapping returns no items.
 * Keeps /assessment/modules/:id/content usable for draft registry modules.
 */

const FREQ_5 = ["Never", "Rarely", "Sometimes", "Often", "Almost always"];

/** @param {string} id @param {string} prompt @param {string} category */
function freqItem(id, prompt, category = "general") {
  return {
    id,
    type: "frequency",
    category,
    prompt,
    scaleLabels: [...FREQ_5],
    difficulty: 2,
    scoringWeight: { [category]: 1 }
  };
}

/** @type {Record<string, { moduleId: string; engineType: string; title: string; estimatedMinutes: number; scoring: { provider: string; constructs: string[] }; items: object[] }>} */
export const STATIC_MODULE_CONFIGS = {
  M08: {
    moduleId: "M08",
    engineType: "likert",
    title: "Expectancy Theory",
    estimatedMinutes: 8,
    scoring: { provider: "rule", constructs: ["VROOM", "EXPECTANCY"] },
    items: [
      freqItem("M8-F01", "How often do you believe that higher effort leads to better performance?", "expectancy"),
      freqItem("M8-F02", "How often do you trust that good performance will be noticed and rewarded?", "instrumentality"),
      freqItem("M8-F03", "How often do the rewards on offer genuinely matter to you?", "valence"),
      freqItem("M8-F04", "How often do you choose goals because the payoff feels personally meaningful?", "valence"),
      freqItem("M8-F05", "How often have you seen effort go unrewarded in ways that reduced your motivation?", "instrumentality")
    ]
  },
  I06: {
    moduleId: "I06",
    engineType: "likert",
    title: "Cognitive Bias Bank",
    estimatedMinutes: 8,
    scoring: { provider: "rule", constructs: ["BIAS"] },
    items: [
      freqItem("I6-F01", "How often do you seek information that confirms what you already believe?", "confirmation_bias"),
      freqItem("I6-F02", "How often do you revise your view when credible evidence contradicts it?", "open_mindedness"),
      freqItem("I6-F03", "How often do you rely on the first number or idea you hear when deciding?", "anchoring")
    ]
  },
  L01: {
    moduleId: "L01",
    engineType: "likert",
    title: "Transformational Leadership",
    estimatedMinutes: 8,
    scoring: { provider: "rule", constructs: ["LEADERSHIP"] },
    items: [
      freqItem("L1-F01", "How often do you inspire others with a clear vision of what is possible?", "inspirational"),
      freqItem("L1-F02", "How often do you challenge people to rethink assumptions and grow?", "intellectual_stimulation"),
      freqItem("L1-F03", "How often do you coach individuals based on their unique strengths?", "individualized_consideration")
    ]
  },
  L02: {
    moduleId: "L02",
    engineType: "likert",
    title: "Transactional Leadership",
    estimatedMinutes: 8,
    scoring: { provider: "rule", constructs: ["LEADERSHIP"] },
    items: [
      freqItem("L2-F01", "How often do you set explicit expectations and track progress closely?", "contingent_reward"),
      freqItem("L2-F02", "How often do you intervene quickly when standards slip?", "management_by_exception"),
      freqItem("L2-F03", "How often do you tie recognition directly to measurable results?", "transactional")
    ]
  },
  L11: {
    moduleId: "L11",
    engineType: "likert",
    title: "Katz Skills",
    estimatedMinutes: 8,
    scoring: { provider: "rule", constructs: ["LEADERSHIP"] },
    items: [
      freqItem("L11-F01", "How often do you apply technical know-how to solve work problems?", "technical"),
      freqItem("L11-F02", "How often do you coordinate people and resources toward shared goals?", "human"),
      freqItem("L11-F03", "How often do you think about how team actions fit the bigger picture?", "conceptual")
    ]
  },
  L12: {
    moduleId: "L12",
    engineType: "likert",
    title: "Action Identification",
    estimatedMinutes: 8,
    scoring: { provider: "rule", constructs: ["LEADERSHIP"] },
    items: [
      freqItem("L12-F01", "How often do you describe your actions in terms of broader goals rather than small steps?", "high_level"),
      freqItem("L12-F02", "How often do you break complex tasks into concrete actions for others?", "low_level"),
      freqItem("L12-F03", "How often do you switch between big-picture and detail focus as needed?", "flexibility")
    ]
  },
  LEN01: {
    moduleId: "LEN01",
    engineType: "likert",
    title: "Maslow Lens",
    estimatedMinutes: 7,
    scoring: { provider: "rule", constructs: ["NARRATIVE", "MASLOW"] },
    items: [
      freqItem("LEN1-F01", "How often do unmet basic needs distract you from learning or work?", "safety"),
      freqItem("LEN1-F02", "How often do belonging and support drive your motivation?", "belonging"),
      freqItem("LEN1-F03", "How often do you pursue growth after foundational needs feel secure?", "self_actualization")
    ]
  },
  LEN02: {
    moduleId: "LEN02",
    engineType: "likert",
    title: "Herzberg Lens",
    estimatedMinutes: 7,
    scoring: { provider: "rule", constructs: ["NARRATIVE", "HERZBERG"] },
    items: [
      freqItem("LEN2-F01", "How often does recognition energize you more than routine perks?", "motivators"),
      freqItem("LEN2-F02", "How often do unfair policies drain your motivation even when pay is fine?", "hygiene"),
      freqItem("LEN2-F03", "How often do meaningful work tasks outweigh minor inconveniences?", "motivators")
    ]
  },
  LEN03: {
    moduleId: "LEN03",
    engineType: "likert",
    title: "Equity Lens",
    estimatedMinutes: 7,
    scoring: { provider: "rule", constructs: ["NARRATIVE", "EQUITY"] },
    items: [
      freqItem("LEN3-F01", "How often do you compare your effort and rewards with peers?", "social_comparison"),
      freqItem("LEN3-F02", "How often does perceived unfairness reduce your effort?", "equity_tension"),
      freqItem("LEN3-F03", "How often do you speak up when distribution of work feels uneven?", "voice")
    ]
  },
  LEN04: {
    moduleId: "LEN04",
    engineType: "likert",
    title: "Reinforcement Lens",
    estimatedMinutes: 7,
    scoring: { provider: "rule", constructs: ["NARRATIVE", "REINFORCEMENT"] },
    items: [
      freqItem("LEN4-F01", "How often do immediate feedback change how you approach a task?", "feedback"),
      freqItem("LEN4-F02", "How often do you repeat behaviors that were praised or rewarded?", "positive_reinforcement"),
      freqItem("LEN4-F03", "How often do you adjust habits after constructive correction?", "learning")
    ]
  }
};

/**
 * @param {string} moduleId
 */
export function getStaticModuleConfig(moduleId) {
  const key = String(moduleId).trim().toUpperCase();
  const cfg = STATIC_MODULE_CONFIGS[key];
  if (!cfg) return null;
  return {
    ...cfg,
    source: "static_fallback",
    bankVersion: "static-v1",
    fastResponseMs: 5500,
    hesitationMs: 11000,
    checkpointInterval: 5,
    autoAdvanceOnSelect: true
  };
}
