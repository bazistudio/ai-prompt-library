import { z } from "zod";

const DEFAULT_MONGODB_URI = "mongodb://localhost:27017/ai-prompt-library";
const DEFAULT_JWT_SECRET = "ai-prompt-library-secret-key-2026-production-offline";

const envSchema = z.object({
  MONGODB_URI: z.string().default(DEFAULT_MONGODB_URI),
  JWT_SECRET: z.string().min(8).default(DEFAULT_JWT_SECRET),
  NEXT_PUBLIC_APP_NAME: z.string().default("AI Prompt Library"),
  SQLITE_DB_PATH: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

let envData: z.infer<typeof envSchema>;

if (typeof window === "undefined") {
  const rawEnv = {
    MONGODB_URI: process.env.MONGODB_URI || DEFAULT_MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "AI Prompt Library",
    SQLITE_DB_PATH: process.env.SQLITE_DB_PATH,
    NODE_ENV: process.env.NODE_ENV || "production",
  };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    console.warn("⚠️ Invalid environment variables configuration, applying safe defaults:", parsed.error.format());
    envData = {
      MONGODB_URI: DEFAULT_MONGODB_URI,
      JWT_SECRET: DEFAULT_JWT_SECRET,
      NEXT_PUBLIC_APP_NAME: "AI Prompt Library",
      SQLITE_DB_PATH: process.env.SQLITE_DB_PATH,
      NODE_ENV: (process.env.NODE_ENV as any) || "production",
    };
  } else {
    envData = parsed.data;
  }
} else {
  envData = {
    MONGODB_URI: "",
    JWT_SECRET: "",
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "AI Prompt Library",
    SQLITE_DB_PATH: undefined,
    NODE_ENV: "development",
  };
}

export const env = envData;
