import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(8),
  NEXT_PUBLIC_APP_NAME: z.string().default("AI Prompt Library"),
  SQLITE_DB_PATH: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

let envData: z.infer<typeof envSchema>;

if (typeof window === "undefined") {
  const parsed = envSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    SQLITE_DB_PATH: process.env.SQLITE_DB_PATH,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables configuration");
  }
  envData = parsed.data;
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
