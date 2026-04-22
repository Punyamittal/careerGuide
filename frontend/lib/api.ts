import { getSupabaseBrowser } from "./supabase-browser";

/**
 * Base URL for `/api/v1` requests.
 * - Browser (default): same-origin `/api/v1` → Next.js rewrites to BACKEND_ORIGIN (see next.config.ts).
 * - Override: set NEXT_PUBLIC_API_URL (e.g. production API URL).
 * - Server-side callers: direct backend URL (no rewrite from Node).
 */
export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return "/api/v1";
  return process.env.BACKEND_INTERNAL_URL?.trim().replace(/\/$/, "") || "http://127.0.0.1:5000/api/v1";
}

export type ApiResponse<T = unknown> = {
  success: boolean;
  error?: string | null;
  message?: string;
  details?: unknown;
  data?: T;
};

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
  /** Use right after sign-in/up — getSession() may not have persisted yet (avoids 401 on /auth/me). */
  accessToken?: string;
};

export async function api<T = unknown>(
  path: string,
  { skipAuth, accessToken: accessTokenOverride, headers, ...init }: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const h = new Headers(headers);
  if (!h.has("Content-Type") && init.body && typeof init.body === "string") {
    h.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    let token = accessTokenOverride?.trim() || undefined;
    if (!token) {
      const {
        data: { session }
      } = await getSupabaseBrowser().auth.getSession();
      token = session?.access_token;
    }
    if (token) {
      h.set("Authorization", `Bearer ${token}`);
    }
  }

  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: h,
      credentials: "include"
    });
  } catch (cause) {
    const hint =
      typeof cause === "object" && cause !== null && "message" in cause
        ? String((cause as Error).message)
        : String(cause);
    throw new Error(
      `Cannot reach API (${url}). ${hint}. Start the backend (port 5000): cd careerGUIDE/backend && npm run dev. The UI proxies /api/v1 to the backend (see next.config.ts BACKEND_ORIGIN). For a remote API, set NEXT_PUBLIC_API_URL.`
    );
  }

  const payload = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (!res.ok) {
    const msg =
      typeof payload.error === "string" && payload.error.trim()
        ? payload.error
        : typeof payload.message === "string"
          ? payload.message
          : `Request failed (${res.status})`;
    const err = new Error(msg) as Error & { status?: number; details?: unknown };
    err.status = res.status;
    err.details = payload.details;
    throw err;
  }

  return payload;
}

/** @deprecated No longer used; tokens come from Supabase session. */
export function setAccessToken(_token: string | null) {
  /* noop */
}

