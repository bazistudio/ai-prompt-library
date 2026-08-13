import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must be under 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters, underscores, or hyphens")
    .trim(),
  email: z.string().email("Invalid email address").trim().lowercase(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().lowercase(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
