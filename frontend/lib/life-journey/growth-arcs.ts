import type { AggregatedSignal, GrowthArc, LifeEventRecord } from "./types";
import { labelForStage } from "./taxonomy";

export function detectGrowthArcs(
  events: LifeEventRecord[],
  signals: AggregatedSignal[]
): GrowthArc[] {
  if (!events.length) return [];

  const arcs: GrowthArc[] = [];
  const score = (id: string) => signals.find((s) => s.signal === id)?.score ?? 0;

  const comparisonCount = events.filter((e) => /compar/i.test(e.eventLabel)).length;
  const transitionCount = events.filter(
    (e) =>
      /transition|chang(e|ing) school|city|schools frequently/i.test(e.eventLabel) ||
      e.subcategory === "Transition"
  ).length;
  const authorityConflict = events.filter(
    (e) => /conflict with authority|clash with authority|micromanage/i.test(e.eventLabel)
  ).length;
  const achievementEvents = events.filter(
    (e) =>
      /achiev|exam|talent|ambitious|scholarship|exceeded/i.test(e.eventLabel) ||
      e.subcategory === "Achievement" ||
      e.subcategory === "Exams / Results"
  ).length;
  const belongingStruggle = events.filter(
    (e) => /exclud|lonely|belong|isolated/i.test(e.eventLabel) || e.impacts.includes("belonging")
  ).length;
  const leadership = events.filter(
    (e) => /lead|mentor|team/i.test(e.eventLabel) || e.subcategory.includes("Leadership")
  ).length;
  const learnedLens = events.filter((e) => e.reflectionLens === "learned").length;
  const highIntensity = events.filter((e) => e.intensity >= 4).length;

  if (score("confidence") >= 0.45 || learnedLens >= 2) {
    arcs.push({
      id: "confidence_growth",
      title: "Confidence growth",
      summary:
        "Repeated experiences of learning, achievement, or self-trust may have contributed to a growing sense of capability — especially when you framed setbacks as lessons.",
      relatedSignals: ["confidence", "resilience"],
      confidence: score("confidence") >= 0.55 ? "high" : "medium"
    });
  }

  if (score("resilience") >= 0.4 && (highIntensity >= 2 || learnedLens >= 1)) {
    arcs.push({
      id: "resilience_development",
      title: "Resilience development",
      summary:
        "Intense or repeated challenges — paired with reflection — may have strengthened your capacity to recover and adapt rather than avoid difficulty.",
      relatedSignals: ["resilience", "adaptability"],
      confidence: "medium"
    });
  }

  if (comparisonCount >= 2 || score("validation_seeking") >= 0.5) {
    arcs.push({
      id: "achievement_orientation",
      title: "Achievement orientation",
      summary:
        "Comparison and performance-related moments may have shaped ambition and how you measure progress — possibly linking self-worth to outcomes.",
      relatedSignals: ["validation_seeking", "ambition", "perfectionism"],
      confidence: comparisonCount >= 3 ? "high" : "medium"
    });
  }

  if (transitionCount >= 2 || score("adaptability") >= 0.5) {
    arcs.push({
      id: "adaptability_pattern",
      title: "Adaptability pattern",
      summary:
        "Frequent transitions may have trained you to reset, reorient, and build independence — change might feel familiar even when uncomfortable.",
      relatedSignals: ["adaptability", "independence"],
      confidence: "medium"
    });
  }

  if (authorityConflict >= 2) {
    arcs.push({
      id: "authority_tension",
      title: "Authority tension",
      summary:
        "Conflicts with authority figures may have influenced how you respond to rules, feedback, and hierarchy — worth exploring in team and career settings.",
      relatedSignals: ["independence", "validation_seeking"],
      confidence: "medium"
    });
  }

  if (belongingStruggle >= 2 || score("belonging") >= 0.45) {
    arcs.push({
      id: "belonging_arc",
      title: "Belonging journey",
      summary:
        "Experiences of exclusion or inclusion may have shaped how safe you feel in groups — belonging could be a recurring theme in school, work, and relationships.",
      relatedSignals: ["belonging", "social_trust"],
      confidence: "medium"
    });
  }

  if (leadership >= 1 && achievementEvents >= 1) {
    arcs.push({
      id: "leadership_emergence",
      title: "Leadership emergence",
      summary:
        "Mentorship, teamwork, or leadership moments alongside achievement themes may point toward comfort with responsibility and guiding others.",
      relatedSignals: ["confidence", "ambition", "social_trust"],
      confidence: "low"
    });
  }

  const schoolEvents = events.filter((e) =>
    ["primary_school", "middle_school", "late_school"].includes(e.lifeStage)
  );
  if (schoolEvents.length >= 3) {
    const stageLabel = labelForStage(schoolEvents[0].lifeStage);
    arcs.push({
      id: "school_chapter",
      title: "School-year chapter",
      summary: `Several mapped moments cluster around school years (e.g. ${stageLabel}) — formative social and academic patterns may still echo in how you approach challenges today.`,
      relatedSignals: [],
      confidence: "low"
    });
  }

  return arcs.slice(0, 5);
}
