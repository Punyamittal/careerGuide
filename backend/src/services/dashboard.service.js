import { mapAttemptRow, mapReportRow } from "../db/mappers.js";
import { getSupabaseAdmin } from "../config/supabase.js";

export const getDashboard = async (userId) => {
  const supabase = getSupabaseAdmin();

  const { data: attemptRow } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: reportRow } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: recentRows } = await supabase
    .from("reports")
    .select("id, attempt_id, created_at, top_careers")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const latestAttempt = attemptRow ? mapAttemptRow(attemptRow) : null;
  const latestReport = reportRow ? mapReportRow(reportRow) : null;

  return {
    latestAttempt: latestAttempt
      ? {
          id: String(latestAttempt._id),
          status: latestAttempt.status,
          submittedAt: latestAttempt.submittedAt,
          careerMatches: latestAttempt.careerMatches?.slice(0, 5)
        }
      : null,
    latestReport: latestReport
      ? {
          id: String(latestReport._id),
          attemptId: String(latestReport.attemptId),
          topCareers: latestReport.topCareers,
          skillGaps: latestReport.skillGaps
        }
      : null,
    recentReports: (recentRows ?? []).map((r) => ({
      id: String(r.id),
      attemptId: String(r.attempt_id),
      createdAt: r.created_at,
      topCareers: r.top_careers
    }))
  };
};

export const getInstitutionOverview = async () => {
  const supabase = getSupabaseAdmin();
  const last30Iso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: studentCount }, { data: scoredAttempts }, { data: reports }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase
      .from("test_attempts")
      .select("user_id, scores, updated_at")
      .eq("status", "scored")
      .gte("updated_at", last30Iso)
      .order("updated_at", { ascending: false })
      .limit(400),
    supabase
      .from("reports")
      .select("user_id, top_careers, skill_gaps, created_at")
      .order("created_at", { ascending: false })
      .limit(250)
  ]);

  const latestAttemptByUser = new Map();
  for (const row of scoredAttempts ?? []) {
    if (!latestAttemptByUser.has(row.user_id)) latestAttemptByUser.set(row.user_id, row);
  }

  const scoreBuckets = {};
  for (const row of latestAttemptByUser.values()) {
    for (const score of flattenForDashboard(row.scores)) {
      scoreBuckets[score.label] = scoreBuckets[score.label] || [];
      scoreBuckets[score.label].push(score.value);
    }
  }

  const classAverages = Object.entries(scoreBuckets)
    .map(([label, values]) => ({
      metric: label,
      value: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const topCareerCounts = {};
  const weakSkillCounts = {};
  for (const report of reports ?? []) {
    const topCareer = Array.isArray(report.top_careers) ? report.top_careers[0] : null;
    if (topCareer?.title) topCareerCounts[topCareer.title] = (topCareerCounts[topCareer.title] ?? 0) + 1;
    for (const gap of Array.isArray(report.skill_gaps) ? report.skill_gaps : []) {
      if (gap?.skill) weakSkillCounts[gap.skill] = (weakSkillCounts[gap.skill] ?? 0) + 1;
    }
  }

  const students = Array.from(latestAttemptByUser.entries())
    .slice(0, 30)
    .map(([userId, row]) => {
      const flat = flattenForDashboard(row.scores).sort((a, b) => b.value - a.value);
      const topSkill = flat[0];
      const topCareer = (reports ?? []).find((report) => report.user_id === userId)?.top_careers?.[0];
      return {
        userId,
        topSkill: topSkill?.label ?? "N/A",
        topSkillScore: topSkill?.value ?? 0,
        topCareer: topCareer?.title ?? "N/A",
        updatedAt: row.updated_at
      };
    });

  return {
    kpis: {
      totalStudents: studentCount ?? 0,
      activeScoredAttempts30d: scoredAttempts?.length ?? 0,
      topCareerDomain:
        Object.entries(topCareerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Not enough data"
    },
    classAverages,
    weakAreas: Object.entries(weakSkillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    students
  };
};

function flattenForDashboard(input, prefix = "") {
  if (!input || typeof input !== "object") return [];
  return Object.entries(input).flatMap(([key, value]) => {
    const label = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "number") return [{ label, value }];
    if (value && typeof value === "object") return flattenForDashboard(value, label);
    return [];
  });
}
