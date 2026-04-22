import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let adminClient;

/**
 * Service-role client for server-side use only (bypasses RLS).
 */
export const getSupabaseAdmin = () => {
  if (!adminClient) {
    adminClient = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return adminClient;
};
