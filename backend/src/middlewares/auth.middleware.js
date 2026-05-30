import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncMiddleware } from "../utils/asyncHandler.js";
import { buildUserFromProfile } from "../utils/userPayload.js";

/** Load profile row; if missing (trigger skipped / legacy user), insert one — mirrors handle_new_user(). */
async function loadOrCreateProfile(supabase, authUser) {
  let { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email, name, role, preferences")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileErr && /preferences|column|does not exist/i.test(String(profileErr.message || ""))) {
    const r2 = await supabase
      .from("profiles")
      .select("id, email, name, role")
      .eq("id", authUser.id)
      .maybeSingle();
    profile = r2.data ? { ...r2.data, preferences: {} } : null;
    profileErr = r2.error;
  }

  if (profileErr) {
    return { error: profileErr };
  }
  if (profile) {
    return { profile };
  }

  const email = authUser.email ?? "";
  const name =
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    (email.includes("@") ? email.split("@")[0] : "") ||
    "";

  const baseRow = {
    id: authUser.id,
    email: email || null,
    name,
    role: "student"
  };

  let { data: created, error: insErr } = await supabase
    .from("profiles")
    .insert(baseRow)
    .select("id, email, name, role, preferences")
    .maybeSingle();

  if (insErr && /preferences|column|does not exist/i.test(String(insErr.message || ""))) {
    const r3 = await supabase
      .from("profiles")
      .insert(baseRow)
      .select("id, email, name, role")
      .maybeSingle();
    created = r3.data ? { ...r3.data, preferences: {} } : null;
    insErr = r3.error;
  }

  if (!insErr && created) {
    return { profile: created };
  }

  if (insErr && /duplicate key|unique/i.test(String(insErr.message || ""))) {
    let { data: againRow, error: againErr } = await supabase
      .from("profiles")
      .select("id, email, name, role, preferences")
      .eq("id", authUser.id)
      .maybeSingle();
    if (againErr && /preferences|column|does not exist/i.test(String(againErr.message || ""))) {
      const r4 = await supabase
        .from("profiles")
        .select("id, email, name, role")
        .eq("id", authUser.id)
        .maybeSingle();
      againRow = r4.data ? { ...r4.data, preferences: {} } : null;
      againErr = r4.error;
    }
    if (againRow) {
      return { profile: againRow };
    }
    if (againErr) {
      return { error: againErr };
    }
  }

  return { error: insErr || new Error("Profile missing and could not be created") };
}

const requireAuthImpl = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Missing or invalid authorization header"));
  }

  const token = authHeader.split(" ")[1];
  const supabase = getSupabaseAdmin();

  let authUser;
  let authErr;
  try {
    ({
      data: { user: authUser },
      error: authErr
    } = await supabase.auth.getUser(token));
  } catch (e) {
    const cause = e?.cause;
    const nestedCode =
      cause?.errors?.[0]?.code ??
      (cause?.name === "AggregateError" && cause?.errors?.[0]?.code);
    const code = e?.code ?? cause?.code ?? nestedCode;
    const isNetwork =
      code === "ETIMEDOUT" ||
      code === "ECONNREFUSED" ||
      code === "ENOTFOUND" ||
      (e instanceof Error && e.message === "fetch failed");
    if (isNetwork) {
      return next(
        new ApiError(
          StatusCodes.SERVICE_UNAVAILABLE,
          "Cannot reach Supabase (check SUPABASE_URL in backend/.env, firewall, and VPN)"
        )
      );
    }
    return next(
      new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        e instanceof Error ? e.message : "Auth verification failed"
      )
    );
  }

  if (authErr || !authUser) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
  }

  const { profile, error: loadErr } = await loadOrCreateProfile(supabase, authUser);

  if (loadErr) {
    return next(
      new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, loadErr.message || "Profile load failed")
    );
  }

  req.user = buildUserFromProfile(profile, authUser.email ?? "");

  return next();
};

export const requireAuth = asyncMiddleware(requireAuthImpl);

/**
 * For routes that support both signed-in users and guests.
 * - No `Authorization` header: `req.user` is omitted (guest).
 * - Valid Bearer token: `req.user` is set like `requireAuth`.
 * - Invalid/expired Bearer token: 401 (do not downgrade to guest).
 */
const optionalAuthImpl = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1]?.trim();
  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Missing or invalid authorization header"));
  }

  const supabase = getSupabaseAdmin();
  let authUser;
  let authErr;

  try {
    ({
      data: { user: authUser },
      error: authErr
    } = await supabase.auth.getUser(token));
  } catch (e) {
    const cause = e?.cause;
    const nestedCode =
      cause?.errors?.[0]?.code ??
      (cause?.name === "AggregateError" && cause?.errors?.[0]?.code);
    const code = e?.code ?? cause?.code ?? nestedCode;
    const isNetwork =
      code === "ETIMEDOUT" ||
      code === "ECONNREFUSED" ||
      code === "ENOTFOUND" ||
      (e instanceof Error && e.message === "fetch failed");
    if (isNetwork) {
      return next(
        new ApiError(
          StatusCodes.SERVICE_UNAVAILABLE,
          "Cannot reach Supabase (check SUPABASE_URL in backend/.env, firewall, and VPN)"
        )
      );
    }
    return next(
      new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        e instanceof Error ? e.message : "Auth verification failed"
      )
    );
  }

  if (authErr || !authUser) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
  }

  const { profile, error: loadErr } = await loadOrCreateProfile(supabase, authUser);

  if (loadErr) {
    return next(
      new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, loadErr.message || "Profile load failed")
    );
  }

  req.user = buildUserFromProfile(profile, authUser.email ?? "");
  return next();
};

export const optionalAuth = asyncMiddleware(optionalAuthImpl);
