import { z } from "zod";

export const activityItemSchema = z.object({
  type: z.enum(["activity", "food", "lodging", "transport"]),
  title: z.string(),
  description: z.string().optional(),
  startTime: z
    .string()
    .optional()
    .describe('Start time in "H:MM AM/PM" format, e.g. "9:30 AM"'),
  duration: z
    .string()
    .optional()
    .describe('Duration such as "1h 30m" or "45m"'),
  googlePlaceId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const fatigueLevelSchema = z.enum([
  "easy",
  "moderate",
  "tiring",
  "exhausting",
]);

export const dayPlanSchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string(),
  summary: z.string().optional(),
  date: z.string().optional(),
  estimatedSteps: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "Estimated walking steps at venues only, excluding travel between stops",
    ),
  fatigueLevel: fatigueLevelSchema
    .optional()
    .describe("How tiring this day is on foot"),
  cityTransport: z
    .string()
    .optional()
    .describe(
      "Recommended way to get around within the city that day (metro, bus, taxi, walking, etc.)",
    ),
  dailyBudgetEstimate: z
    .object({
      accommodation: z
        .number()
        .min(0)
        .describe(
          "Per-person accommodation cost for this night (0 on checkout day if no new lodging)",
        ),
      transport: z
        .number()
        .min(0)
        .describe(
          "Per-person transport cost for this day (flights, trains, taxis, intercity buses)",
        ),
      activities: z
        .number()
        .min(0)
        .describe(
          "Per-person activities cost (entrance fees, tours, guided experiences)",
        ),
      food: z
        .number()
        .min(0)
        .describe(
          "Per-person food & drinks estimate (breakfast + lunch + dinner)",
        ),
      total: z
        .number()
        .min(0)
        .describe("Sum of accommodation + transport + activities + food"),
    })
    .optional()
    .describe(
      "Realistic per-person cost breakdown for this day in the trip's budget currency, based on destination price levels",
    ),
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
