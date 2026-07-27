import { z } from "zod";

export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  GRAPH_DATABASE_PATH: z.string().min(1).default(".data/graph"),
  KNOWLEDGE_ROOT: z.string().min(1).default("knowledge"),
  TRACE_OUTPUT_PATH: z.string().default(".data/traces"),
  EVE_MODEL_PROVIDER: z.string().min(1),
  EVE_MODEL_NAME: z.string().min(1),
  EVE_MODEL_API_KEY: z.string().min(1),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

export function loadEnv(): Environment {
  return EnvironmentSchema.parse(process.env);
}
