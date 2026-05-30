"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { api } from "@/lib/api";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { saveClientSettings } from "@/lib/settings-storage";

export type UserPreferences = {
  emailDigest: boolean;
  compactSidebarHints: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences: UserPreferences;
};

function mapSupabaseNetworkError(message: string): string {
  const m = message.trim();
  const looksLikeNetworkFailure =
    m === "Failed to fetch" ||
    m.includes("NetworkError") ||
    /^AuthRetryableFetchError/i.test(m);
  if (looksLikeNetworkFailure) {
    return (
      "Cannot reach Supabase: the Project URL in frontend/.env (VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL) does not resolve. " +
      "Copy a new Project URL and anon key from Supabase → Project Settings → API, update frontend/.env, restart the Next dev server, and set backend SUPABASE_URL to the same project."
    );
  }
  return message;
}

function normalizeUser(raw: {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences?: Partial<UserPreferences> | null;
}): AuthUser {
  return {
    id: raw.id,
    name: raw.name ?? "",
    email: raw.email ?? "",
    role: raw.role ?? "student",
    preferences: {
      emailDigest: !!raw.preferences?.emailDigest,
      compactSidebarHints: !!raw.preferences?.compactSidebarHints
    }
  };
}

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  patchProfile: (patch: {
    name?: string;
    preferences?: Partial<UserPreferences>;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async (sessionHint?: { access_token: string } | null) => {
    try {
      let accessToken = sessionHint?.access_token;
      if (sessionHint === null) {
        setUser(null);
        return;
      }
      if (!accessToken) {
        const {
          data: { session }
        } = await getSupabaseBrowser().auth.getSession();
        accessToken = session?.access_token;
      }
      if (!accessToken) {
        setUser(null);
        return;
      }
      const res = await api<{ user: AuthUser }>("/auth/me", { accessToken });
      if (res.data?.user) {
        const u = normalizeUser(res.data.user);
        setUser(u);
        if (typeof window !== "undefined") {
          saveClientSettings(u.preferences);
        }
      } else setUser(null);
    } catch (e) {
      setUser(null);
      // Stale or invalid JWT still in storage → Supabase keeps session; /auth/me 401s on every refresh.
      // Clear auth only for token errors, not "Profile not found" (fix DB instead).
      const status = e && typeof e === "object" && "status" in e ? (e as { status?: number }).status : undefined;
      const msg = e instanceof Error ? e.message : "";
      if (
        status === 401 &&
        !msg.includes("Profile not found") &&
        (msg.includes("Invalid or expired token") ||
          msg.includes("Missing or invalid authorization header"))
      ) {
        await getSupabaseBrowser().auth.signOut({ scope: "local" });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let cancelled = false;

    const safety = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 12_000);

    void refreshSession().finally(() => {
      window.clearTimeout(safety);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void refreshSession(session ?? null);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapSupabaseNetworkError(error.message));
    const accessToken =
      data.session?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;
    if (!accessToken) throw new Error("No session after login — try again.");
    const res = await api<{ user: AuthUser }>("/auth/me", { accessToken });
    if (!res.data?.user) throw new Error("Could not load profile");
    const u = normalizeUser(res.data.user);
    setUser(u);
    setLoading(false);
    if (typeof window !== "undefined") {
      saveClientSettings(u.preferences);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) throw new Error(mapSupabaseNetworkError(error.message));
    if (!data.session) {
      throw new Error(
        "Check your email to confirm your account, or disable email confirmation in Supabase Auth settings for local dev."
      );
    }
    let accessToken = data.session.access_token;
    let res = await api<{ user: AuthUser }>("/auth/me", { accessToken });
    if (!res.data?.user) {
      await new Promise((r) => setTimeout(r, 400));
      const t =
        (await supabase.auth.getSession()).data.session?.access_token ?? accessToken;
      res = await api<{ user: AuthUser }>("/auth/me", { accessToken: t });
    }
    if (res.data?.user) {
      const u = normalizeUser(res.data.user);
      setUser(u);
      setLoading(false);
      if (typeof window !== "undefined") {
        saveClientSettings(u.preferences);
      }
    }
  }, []);

  const patchProfile = useCallback(
    async (patch: { name?: string; preferences?: Partial<UserPreferences> }) => {
      const res = await api<{ user: AuthUser }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(patch)
      });
      if (!res.data?.user) {
        throw new Error("Could not update profile");
      }
      const u = normalizeUser(res.data.user);
      setUser(u);
      if (typeof window !== "undefined") {
        saveClientSettings(u.preferences);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    // Local scope avoids 403 on /auth/v1/logout?scope=global when refresh token is stale or server rejects global revoke.
    await getSupabaseBrowser().auth.signOut({ scope: "local" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshSession,
      patchProfile
    }),
    [user, loading, login, register, logout, refreshSession, patchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
