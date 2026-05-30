import { getOccupationBySoc } from "./occupationCatalog.service.js";
import { analyzeSkillGapsForOccupation } from "./skillGap.service.js";
import { getActiveRelease } from "./release.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

const PHASES_BY_JOB_ZONE = {
  1: ["Explore basics", "Hands-on practice", "Entry credential"],
  2: ["Foundation skills", "Guided projects", "Work exposure"],
  3: ["Core competency build", "Portfolio or certification", "Mentored experience"],
  4: ["Advanced study", "Specialization", "Leadership exposure"],
  5: ["Graduate-level depth", "Strategic projects", "Executive mentorship"]
};

/**
 * Template-first roadmap (AI enrichment can be added later via report/ai.service).
 * @param {object} scores
 * @param {string} socCode
 * @param {object} [intakeProfile]
 */
export const generateOccupationRoadmap = async (scores, socCode, intakeProfile = {}) => {
  const release = await getActiveRelease();
  if (!release) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "No active O*NET release");
  }

  const occupation = await getOccupationBySoc(release.id, socCode);
  const { gaps } = await analyzeSkillGapsForOccupation(scores, socCode, 6);
  const zone = occupation.job_zone ?? 3;
  const phaseLabels = PHASES_BY_JOB_ZONE[zone] ?? PHASES_BY_JOB_ZONE[3];

  const barriers = Array.isArray(intakeProfile.barriers) ? intakeProfile.barriers : [];
  const support = intakeProfile.supportAvailable || intakeProfile.parentSupport;

  const phases = phaseLabels.map((label, index) => {
    const gap = gaps[index % Math.max(1, gaps.length)];
    return {
      phase: index + 1,
      title: label,
      focus: gap?.skill ?? "Core occupational readiness",
      actions: [
        gap
          ? `Targeted practice: ${gap.skill} — ${gap.rationale}`
          : "Complete one structured learning module aligned with this occupation.",
        index === 0 && barriers.length
          ? `Address stated barrier: ${barriers[0]}`
          : "Track weekly progress in a learning journal.",
        support === "low" && index === 1
          ? "Identify one school or community mentor for accountability."
          : "Review progress every 2 weeks and adjust goals."
      ].slice(0, 3),
      durationWeeks: zone <= 2 ? 4 : 6
    };
  });

  return {
    releaseId: release.id,
    socCode,
    occupationTitle: occupation.title,
    jobZone: zone,
    horizonMonths: zone >= 4 ? 24 : zone >= 3 ? 18 : 12,
    phases,
    priorityGaps: gaps.slice(0, 4),
    generatedAt: new Date().toISOString(),
    source: "template_v1"
  };
};
