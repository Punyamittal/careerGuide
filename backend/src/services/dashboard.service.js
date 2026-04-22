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
