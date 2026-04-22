import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function readPublicEnv() {
  // next.config.ts maps VITE_* → NEXT_PUBLIC_* for the browser bundle
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return { url: url?.trim() || undefined, anon: anon?.trim() || undefined };
}

export function getSupabaseBrowser(): SupabaseClient {
  if (client) return client;
  const { url, anon } = readPublicEnv();
  if (!url || !anon) {
    throw new Error(
      "Missing Supabase URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_* equivalents)."
    );
  }
  client = createClient(url, anon);
  return client;
}
