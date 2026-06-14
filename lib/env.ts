import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  UNSPLASH_ACCESS_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

export function getServerEnv(): ServerEnv {
  return serverSchema.parse(process.env);
}

export function getClientEnv() {
  return clientSchema.parse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
}

export function getGeminiApiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
}

export function validateServerEnvOnBoot() {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.CLERK_SECRET_KEY) missing.push("CLERK_SECRET_KEY");
  if (!getGeminiApiKey()) missing.push("GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY");

  if (missing.length > 0) {
    console.warn(`[env] Missing recommended variables: ${missing.join(", ")}`);
  }
}
