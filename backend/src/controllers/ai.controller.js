import { getSupabaseAdmin } from "../config/supabase.js";
import { careerChat } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const postChat = asyncHandler(async (req, res) => {
  const { message, context: clientContext } = req.body;

  const supabase = getSupabaseAdmin();
  const { data: latest } = await supabase
    .from("test_attempts")
    .select("scores, career_matches")
    .eq("user_id", req.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const serverContext = {
    ...(clientContext && typeof clientContext === "object" ? clientContext : {}),
    ...(latest?.scores ? { latestScores: latest.scores } : {}),
    ...(Array.isArray(latest?.career_matches) && latest.career_matches.length
      ? { latestTopCareers: latest.career_matches.slice(0, 3) }
      : {})
  };

  const { reply, provider } = await careerChat(message, serverContext);
  return sendSuccess(res, { reply, provider });
});
