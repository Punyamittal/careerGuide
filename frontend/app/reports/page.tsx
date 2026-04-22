"use client";

import Link from "next/link";
import { gameCatalog, careerProfiles, type SkillAxis } from "@/lib/cireern-data";
import { useCireernStore } from "@/lib/cireern-store";
import { resolveInternshipSlug } from "@/lib/virtual-internships";

const cardClass =
  "rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]";

const skillLabel: Record<SkillAxis, string> = {
  memory: "Memory",
  processingSpeed: "Processing speed",
  logic: "Logic",
  balance: "Balance",
  coordination: "Coordination",
  creativity: "Creativity"
};

function toPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function confidenceLabel(score: number, sessionsCount: number) {
  if (score >= 85 && sessionsCount >= 6) return "High";
  if (score >= 75 && sessionsCount >= 3) return "Medium";
  return "Emerging";
}

export default function ReportsPage() {
  const profile = useCireernStore((state) => state.onboardingProfile);
  const skills = useCireernStore((state) => state.skills);
  const sessions = useCireernStore((state) => state.sessions);
  const actions = useCireernStore((state) => state.actions);
  const getCareerMatches = useCireernStore((state) => state.getCareerMatches);

  const matches = getCareerMatches().slice(0, 5);
  const topTraits = (Object.entries(skills) as Array<[SkillAxis, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const strengths = topTraits.slice(0, 2).map(([axis]) => skillLabel[axis]);
  const successRate = actions.length
    ? Math.round((actions.filter((a) => a.success).length / actions.length) * 100)
    : 0;
  const avgAccuracy = sessions.length
    ? Math.round((sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length) * 100)
    : 0;
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
    : 0;

  const logicalAptitude = Math.round((skills.logic * 0.7 + skills.memory * 0.3) * 10) / 10;
  const numericalAptitude = Math.round((skills.processingSpeed * 0.6 + skills.logic * 0.4) * 10) / 10;
  const verbalAptitude = Math.round((skills.memory * 0.5 + skills.creativity * 0.5) * 10) / 10;

  const riasec = {
    realistic: Math.round((skills.balance * 0.6 + skills.coordination * 0.4) * 10) / 10,
    investigative: Math.round((skills.logic * 0.7 + skills.memory * 0.3) * 10) / 10,
    artistic: skills.creativity,
    social: Math.round((skills.coordination * 0.5 + skills.balance * 0.5) * 10) / 10,
    enterprising: Math.round((skills.processingSpeed * 0.6 + skills.coordination * 0.4) * 10) / 10,
    conventional: Math.round((skills.memory * 0.6 + skills.processingSpeed * 0.4) * 10) / 10
  };
  const topInterests = Object.entries(riasec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const gameInsight = sessions
    .slice(0, 6)
    .map((s) => gameCatalog.find((g) => g.id === s.gameId)?.name)
    .filter(Boolean)
    .join(", ");

  const recommendedCareers = matches.map((m) => {
    const career = careerProfiles.find((c) => c.name === m.name);
    const requiredTopSkills = career
      ? (Object.entries(career.required) as Array<[SkillAxis, number]>)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([axis]) => skillLabel[axis])
      : [];

    const overlapStrengths = strengths.filter((s) => requiredTopSkills.includes(s));
    return {
      ...m,
      confidence: confidenceLabel(m.matchPct, sessions.length),
      requiredTopSkills,
      reason:
        overlapStrengths.length > 0
          ? `Strong overlap with your ${overlapStrengths.join(", ").toLowerCase()} strengths.`
          : "Your current game-based profile aligns with this role's skill pattern."
    };
  });

  const skillGapMap = new Map<string, { priority: string; rationale: string }>();
  recommendedCareers.slice(0, 3).forEach((career) => {
    const fullCareer = careerProfiles.find((c) => c.name === career.name);
    if (!fullCareer) return;
    (Object.entries(fullCareer.required) as Array<[SkillAxis, number]>).forEach(([axis, required]) => {
      const gap = required - skills[axis];
      if (gap <= 8) return;
      if (skillGapMap.has(skillLabel[axis])) return;
      const priority = gap >= 20 ? "High" : gap >= 12 ? "Medium" : "Low";
      skillGapMap.set(skillLabel[axis], {
        priority,
        rationale: `Needed for ${career.name}. Current ${toPercent(skills[axis])} vs target ${toPercent(required)}.`
      });
    });
  });
  const skillGaps = Array.from(skillGapMap.entries())
    .slice(0, 6)
    .map(([skill, meta]) => ({ skill, ...meta }));

  const problems = [
    ...(sessions.length < 4 ? ["Limited gameplay data, so recommendations are still improving."] : []),
    ...(avgAccuracy < 70 ? ["Accuracy consistency is low; focus on fewer mistakes before speed."] : []),
    ...(successRate < 65 ? ["Action success rate is below ideal; practice in timed drills is recommended."] : []),
    ...(profile.ageBand ? [] : ["Age band is not set, so age-specific guidance is partially generic."])
  ];

  const learningStyle =
    skills.logic >= skills.memory
      ? "You learn best with structured, problem-solving practice and short feedback loops."
      : "You learn best with repeated recall, examples, and gradual progression.";

  const roadmap = [
    {
      phase: "Month 1-2",
      items: [
        "Build fundamentals in your top career domain using daily 30-40 minute practice blocks.",
        "Run at least 8 game sessions and track accuracy trends.",
        "Strengthen one high-priority gap with focused drills."
      ]
    },
    {
      phase: "Month 3-4",
      items: [
        "Start 1 mini-project aligned with your top career recommendation.",
        "Improve weak aptitude area with weekly review and timed exercises.",
        "Shadow real role tasks through project videos or internships."
      ]
    },
    {
      phase: "Month 5-6",
      items: [
        "Create 2 portfolio artifacts (project/demo/write-up).",
        "Reassess report after new gameplay + assessment cycles.",
        "Finalize primary path plus 2 backup options."
      ]
    }
  ];

  const alternatives = getCareerMatches()
    .slice(5, 8)
    .map((c) => c.name);

  const reportJson = {
    summary: `${profile.name || "You"} are ${topTraits.map(([axis]) => skillLabel[axis].toLowerCase()).join(", ")} oriented with ${toPercent(avgAccuracy)} average accuracy.`,
    personality: {
      top_traits: topTraits.map(([axis, value]) => ({ trait: skillLabel[axis], score: value })),
      behavioral_tendency: learningStyle
    },
    aptitude: {
      logical: logicalAptitude,
      numerical: numericalAptitude,
      verbal: verbalAptitude
    },
    interests: Object.fromEntries(topInterests),
    careers: recommendedCareers.slice(0, 5).map((c) => ({
      title: c.name,
      match_score: c.matchPct,
      confidence: c.confidence,
      reason: c.reason,
      required_skills: c.requiredTopSkills
    })),
    skill_gaps: skillGaps,
    learning_style: learningStyle,
    problems,
    roadmap,
    alternatives
  };

  return (
    <main className="min-h-screen bg-cg-canvas p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Personalized report</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-cg-text">Career Report</h1>
          <p className="mt-3 text-sm text-cg-muted">
            {profile.name || "You"} are analytical, {strengths.join(" and ").toLowerCase()} focused, and best suited to structured career tracks with clear skill progression.
          </p>
          <p className="mt-2 text-xs text-cg-muted">
            Based on: {sessions.length} sessions, {actions.length} actions, avg score {avgScore}, avg accuracy {toPercent(avgAccuracy)}, action success {toPercent(successRate)}.
          </p>
          {gameInsight ? <p className="mt-1 text-xs text-cg-muted">Recent games: {gameInsight}.</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/overview?tab=assessments" className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-3 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--cg-3d-border)]">
              Improve report quality
            </Link>
            <Link href="/overview" className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]">
              Back to Overview
            </Link>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className={cardClass}>
            <h2 className="font-display text-xl font-bold text-cg-text">Personality breakdown</h2>
            <ul className="mt-3 space-y-2 text-sm text-cg-muted">
              <li>Top traits: {topTraits.map(([axis]) => skillLabel[axis]).join(", ")}</li>
              <li>Behavior tendency: Consistency {toPercent(successRate)} with {toPercent(avgAccuracy)} test accuracy.</li>
              <li>Learning style: {learningStyle}</li>
            </ul>
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-xl font-bold text-cg-text">Aptitude analysis</h2>
            <ul className="mt-3 space-y-2 text-sm text-cg-muted">
              <li>Logical: {toPercent(logicalAptitude)} (pattern + reasoning strength).</li>
              <li>Numerical: {toPercent(numericalAptitude)} (speed + accuracy potential).</li>
              <li>Verbal: {toPercent(verbalAptitude)} (recall + expression potential).</li>
            </ul>
          </section>
        </div>

        <section className={cardClass}>
          <h2 className="font-display text-xl font-bold text-cg-text">Interest mapping (RIASEC)</h2>
          <p className="mt-2 text-sm text-cg-muted">
            Top interests: {topInterests.map(([k, v]) => `${k} (${toPercent(v)})`).join(", ")}.
          </p>
          <p className="mt-2 text-sm text-cg-muted">
            This indicates preference for {topInterests[0]?.[0] ?? "investigative"}-oriented work translated into practical and analytical career paths.
          </p>
        </section>

        <section className={cardClass}>
          <h2 className="font-display text-xl font-bold text-cg-text">Career recommendations</h2>
          <div className="mt-3 space-y-3">
            {recommendedCareers.slice(0, 5).map((career) => (
              <article key={career.name} className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-cg-text">{career.name}</p>
                  <p className="text-xs font-semibold text-cg-muted">
                    Match {toPercent(career.matchPct)} · Confidence {career.confidence}
                  </p>
                </div>
                <p className="mt-1 text-sm text-cg-muted">{career.reason}</p>
                <p className="mt-1 text-xs text-cg-muted">
                  Required skills: {career.requiredTopSkills.join(", ") || "Role-specific competency mix"}
                </p>
                {resolveInternshipSlug(undefined, career.name) ? (
                  <Link
                    href={`/internship/${encodeURIComponent(resolveInternshipSlug(undefined, career.name) as string)}`}
                    className="mt-3 inline-block rounded-lg border-2 border-[var(--cg-3d-border)] bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-950 shadow-[2px_2px_0_0_var(--cg-3d-border)]"
                  >
                    Open Career Match
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className={cardClass}>
            <h2 className="font-display text-xl font-bold text-cg-text">Skill gap analysis</h2>
            <ul className="mt-3 space-y-2 text-sm text-cg-muted">
              {skillGaps.length ? (
                skillGaps.map((gap) => (
                  <li key={gap.skill}>
                    <span className="font-semibold text-cg-text">{gap.skill}</span> ({gap.priority}) - {gap.rationale}
                  </li>
                ))
              ) : (
                <li>No critical gaps yet. Continue consistent practice for sharper recommendations.</li>
              )}
            </ul>
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-xl font-bold text-cg-text">Problems and constraints</h2>
            <ul className="mt-3 space-y-2 text-sm text-cg-muted">
              {problems.length ? problems.map((p) => <li key={p}>{p}</li>) : <li>No major constraints detected in current data.</li>}
            </ul>
          </section>
        </div>

        <section className={cardClass}>
          <h2 className="font-display text-xl font-bold text-cg-text">3-6 month roadmap</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {roadmap.map((step) => (
              <article key={step.phase} className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-3">
                <p className="font-semibold text-cg-text">{step.phase}</p>
                <ul className="mt-2 space-y-1 text-xs text-cg-muted">
                  {step.items.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="font-display text-xl font-bold text-cg-text">Alternative career paths</h2>
          <p className="mt-2 text-sm text-cg-muted">{alternatives.length ? alternatives.join(", ") : "Take more assessments to unlock alternatives."}</p>
          <p className="mt-3 text-sm font-medium text-cg-text">
            Final recommendation: Focus on analytical and technical tracks first, then validate with projects and repeated assessments.
          </p>
        </section>

        <section className={cardClass}>
          <h2 className="font-display text-xl font-bold text-cg-text">Technical report JSON (MVP format)</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-[var(--cg-3d-border)] bg-[#f8f5ef] p-3 text-xs text-cg-text">
            {JSON.stringify(reportJson, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
