import { z } from "zod";

export const activityItemSchema = z.object({
  type: z.enum(["activity", "food", "lodging", "transport"]),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  duration: z.string().optional(),
  googlePlaceId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const dayPlanSchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string(),
  summary: z.string().optional(),
  date: z.string().optional(),
  items: z.array(activityItemSchema),
});

export const itineraryDraftSchema = z.object({
  days: z.array(dayPlanSchema).min(1),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;
export type DayPlan = z.infer<typeof dayPlanSchema>;
export type ItineraryDraft = z.infer<typeof itineraryDraftSchema>;

export const itemTypeMap = {
  activity: "ACTIVITY",
  food: "FOOD",
  lodging: "LODGING",
  transport: "TRANSPORT",
} as const;
