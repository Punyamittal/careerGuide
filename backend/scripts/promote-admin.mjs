/**
 * Usage: node scripts/promote-admin.mjs user@example.com
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promote-admin.mjs <email>");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data, error } = await supabase
  .from("profiles")
  .update({ role: "admin", updated_at: new Date().toISOString() })
  .eq("email", email.toLowerCase())
  .select("email")
  .maybeSingle();

if (error) {
  console.error(error.message);
  process.exit(1);
}
if (!data) {
  console.error("User profile not found:", email);
  process.exit(1);
}

console.log("Promoted to admin:", data.email);
