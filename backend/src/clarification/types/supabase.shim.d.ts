declare module "../../config/supabase.js" {
  import type { SupabaseClient } from "@supabase/supabase-js";
  export function getSupabaseAdmin(): SupabaseClient;
}

declare module "../../../config/supabase.js" {
  import type { SupabaseClient } from "@supabase/supabase-js";
  export function getSupabaseAdmin(): SupabaseClient;
}
