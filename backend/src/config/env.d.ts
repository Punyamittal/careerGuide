export const env: {
  nodeEnv: string;
  port: number;
  supabase: { url: string; serviceRoleKey: string };
  clarification: { featureFlag: boolean; assetsDir: string };
  mongodb: { uri: string; dbName: string };
};
