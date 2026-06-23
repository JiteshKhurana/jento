import { google } from "@ai-sdk/google";
import { extractJsonMiddleware, wrapLanguageModel } from "ai";

/** Gemma via Google, stripping markdown fences from structured JSON responses. */
export function gemmaStructuredModel() {
  return wrapLanguageModel({
    model: google("gemma-4-31b-it"),
    middleware: extractJsonMiddleware(),
  });
}
