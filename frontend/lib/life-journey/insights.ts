import type {
  AggregatedSignal,
  CareerInfluenceSummary,
  JourneyInsight,
  LifeEventRecord,
  LifeStageId,
  PsychologicalSignalId
} from "./types";
import { detectGrowthArcs } from "./growth-arcs";
import { aggregateSignals } from "./signal-engine";
import { labelForDomain, labelForStage, STAGE_ORDER } from "./taxonomy";

export type InsightOptions = {
  stageFilter?: LifeStageId | "all";
};

const supportive = (text: string): JourneyInsight => ({
  id: crypto.randomUUID(),
  text,
  category: "pattern",
  relatedSignals: [],
  confidence: "medium"
});

function filterEventsByStage(
  events: LifeEventRecord[],
  stageFilter?: LifeStageId | "all"
): LifeEventRecord[] {
  if (!stageFilter || stageFilter === "all") return events;
  return events.filter((e) => e.lifeStage === stageFilter);
}

export function generateJourneyInsights(
  events: LifeEventRecord[],
  signals: AggregatedSignal[],
  options?: InsightOptions
): JourneyInsight[] {
  const scoped = filterEventsByStage(events, options?.stageFilter);
  const scopedSignals =
    options?.stageFilter && options.stageFilter !== "all" ? aggregateSignals(scoped) : signals;

  if (!events.length) {
    return [
      supportive(
        "As you add life experiences, CareerGuide will surface patterns that may have influenced your motivation, confidence, and direction — using supportive, exploratory language only."
      )
    ];
  }

  if (!scoped.length && options?.stageFilter && options.stageFilter !== "all") {
    return [
      supportive(
        `No experiences mapped for **${labelForStage(options.stageFilter)}** yet. Add a moment from this chapter to see stage-specific patterns.`
      )
    ];
  }

  const insights: JourneyInsight[] = [];
  const top = scopedSignals[0];
  const byDomain = new Map<string, number>();
  const byType = new Map<string, number>();
  const comparisonCount = scoped.filter((e) => /compar/i.test(e.eventLabel)).length;
  const transitionCount = scoped.filter(
    (e) => /transition|chang(e|ing) school|city/i.test(e.eventLabel) || e.subcategory === "Transition"
  ).length;
  const leadershipCount = scoped.filter(
    (e) => /lead|mentor|team/i.test(e.eventLabel) || e.subcategory.includes("Leadership")
  ).length;
  const schoolStages = scoped.filter((e) =>
    ["primary_school", "middle_school", "late_school"].includes(e.lifeStage)
  ).length;

  if (options?.stageFilter && options.stageFilter !== "all" && scoped.length > 0) {
    insights.push({
      ...supportive(
        `Focused on **${labelForStage(options.stageFilter)}**: ${scoped.length} experience(s) may reveal chapter-specific patterns in motivation and confidence.`
      ),
      category: "exploration",
      relatedSignals: [],
      confidence: "low"
    });
  }

  for (const arc of detectGrowthArcs(scoped, scopedSignals)) {
    insights.push({
      id: arc.id,
      text: arc.summary,
      category: "pattern",
      relatedSignals: arc.relatedSignals,
      confidence: arc.confidence
    });
  }

  for (const e of scoped) {
    byDomain.set(e.domain, (byDomain.get(e.domain) ?? 0) + 1);
    byType.set(e.eventType, (byType.get(e.eventType) ?? 0) + 1);
  }

  if (comparisonCount >= 2) {
    insights.push({
      ...supportive(
        "Repeated comparison-related experiences may have shaped achievement pressure and patterns of external validation — this could contribute to how you measure success today."
      ),
      category: "pattern",
      relatedSignals: ["validation_seeking", "perfectionism", "ambition"],
      confidence: comparisonCount >= 3 ? "high" : "medium"
    });
  }

  if (transitionCount >= 2) {
    insights.push({
      ...supportive(
        "Frequent transitions may have strengthened adaptability and independence — environments that change often might feel more familiar to you than static routines."
      ),
      category: "strength",
      relatedSignals: ["adaptability", "independence"],
      confidence: "medium"
    });
  }

  if (leadershipCount >= 1 && schoolStages >= 2) {
    insights.push({
      ...supportive(
        "Leadership or mentor experiences during school years may have influenced confidence development and your comfort with responsibility."
      ),
      category: "career",
      relatedSignals: ["confidence", "ambition", "social_trust"],
      confidence: "medium"
    });
  }

  const dominantDomain = [...byDomain.entries()].sort((a, b) => b[1] - a[1])[0];
  if (dominantDomain && dominantDomain[1] >= 2) {
    insights.push({
      ...supportive(
        `Several experiences in **${labelForDomain(dominantDomain[0] as LifeEventRecord["domain"])}** may have influenced how you interpret pressure, belonging, and personal growth.`
      ),
      category: "exploration",
      relatedSignals: [],
      confidence: "low"
    });
  }

  if ((byType.get("repeated") ?? 0) >= 2) {
    insights.push({
      ...supportive(
        "Repeated situations (rather than one-off moments) appear often in your map — slow-building patterns may be especially meaningful for understanding your habits and reactions."
      ),
      category: "pattern",
      relatedSignals: ["validation_seeking", "adaptability"],
      confidence: "medium"
    });
  }

  if (top && top.score >= 0.5) {
    insights.push({
      ...supportive(
        `Across your timeline, **${top.label.toLowerCase()}** themes show up frequently — this may have influenced how you approach challenges and relationships.`
      ),
      category: "exploration",
      relatedSignals: [top.signal],
      confidence: "medium"
    });
  }

  const emotionCounts = new Map<string, number>();
  for (const e of scoped) {
    for (const em of e.emotions) emotionCounts.set(em, (emotionCounts.get(em) ?? 0) + 1);
  }
  const dominantEmotion = [...emotionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (dominantEmotion && dominantEmotion[1] >= 2) {
    insights.push({
      ...supportive(
        `Emotional tones such as **${dominantEmotion[0].replace(/_/g, " ")}** appear often in this map — they may hint at how you typically process pressure and wins.`
      ),
      category: "exploration",
      relatedSignals: [],
      confidence: "low"
    });
  }

  const stillAffects = scoped.filter((e) => e.reflectionLens === "still_affects").length;
  if (stillAffects >= 2) {
    insights.push({
      ...supportive(
        "Some experiences still feel active for you today — exploring them with curiosity (not judgment) may help connect past patterns to current career choices."
      ),
      category: "exploration",
      relatedSignals: ["emotional_sensitivity", "resilience"],
      confidence: "low"
    });
  }

  if (!insights.length) {
    insights.push(
      supportive(
        "Your life map is beginning to take shape. More events will help reveal patterns in motivation, confidence, and career direction."
      )
    );
  }

  return insights.slice(0, 8);
}


export function buildCareerInfluenceSummary(
  events: LifeEventRecord[],
  signals: AggregatedSignal[]
): CareerInfluenceSummary {
  if (!events.length) {
    return {
      headline: "Your career story starts with lived experience",
      bullets: [
        "Add a few meaningful moments to see how confidence, direction, and motivation may connect.",
        "Insights use exploratory language — never clinical labels or diagnoses."
      ],
      suggestedExplorations: ["Complete a CareerGuide assessment track", "Explore career matches after 3+ events"]
    };
  }

  const bullets: string[] = [];
  const explorations: string[] = [];
  const careerEvents = events.filter((e) => e.domain === "career_education" || e.domain === "ksa");
  const topSignals = signals.slice(0, 3).map((s) => s.label.toLowerCase());

  if (careerEvents.length) {
    bullets.push(
      `${careerEvents.length} education or capability-related experience(s) may have influenced your academic and career choices.`
    );
    explorations.push("Compare RIASEC career matches with your mapped motivation patterns");
  }

  if (topSignals.length) {
    bullets.push(
      `Recurring themes around ${topSignals.join(", ")} could contribute to how you approach decisions and setbacks.`
    );
  }

  const latestStage = [...events].sort(
    (a, b) => STAGE_ORDER.indexOf(a.lifeStage) - STAGE_ORDER.indexOf(b.lifeStage)
  ).at(-1);

  if (latestStage) {
    bullets.push(
      `Your most recent mapped phase is **${labelForStage(latestStage.lifeStage)}** — current priorities may still be absorbing earlier patterns.`
    );
  }

  bullets.push(
    "These reflections are hypotheses for self-discovery — pair them with formal assessments for a fuller picture."
  );

  explorations.push("Discuss patterns with a mentor or counsellor", "Revisit events after major life changes");

  return {
    headline: "How your journey may connect to career direction",
    bullets,
    suggestedExplorations: explorations
  };
}
