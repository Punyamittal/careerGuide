import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  /** Comma-separated (production). In development the API allows any origin via CORS. */
  clientOrigin:
    process.env.CLIENT_ORIGIN ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  },
  xai: {
    apiKey: process.env.XAI_API_KEY || "",
    model: process.env.XAI_MODEL || "grok-2-latest",
    timeoutMs: Number(process.env.XAI_TIMEOUT_MS) || 120000
  },
  occupational: {
    /** When false, submit skips O*NET matching (legacy flow only). */
    matchingEnabled: process.env.OCCUPATION_MATCHING_ENABLED !== "false",
    /** Optional override; otherwise uses onet_releases.is_active = true */
    activeReleaseId: process.env.ONET_ACTIVE_RELEASE_ID?.trim() || null,
    defaultMatchLimit: Math.min(50, Math.max(1, Number(process.env.ONET_MATCH_LIMIT) || 12)),
    catalogCacheTtlMs: Number(process.env.ONET_CATALOG_CACHE_TTL_MS) || 300_000
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "",
    dbName: process.env.MONGODB_DB_NAME || "careerguide"
  },
  clarification: {
    featureFlag: process.env.USER6_CLARIFICATION_V2 !== "false",
    assetsDir: process.env.CLARIFICATION_ASSETS_DIR || ""
  }
};
