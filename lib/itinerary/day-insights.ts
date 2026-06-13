export type FatigueLevel = "easy" | "moderate" | "tiring" | "exhausting";

export type TransportMode = "walk" | "metro" | "bus" | "taxi" | "bike";

export type DayInsights = {
  estimatedSteps: number;
  walkingDistanceKm: number;
  fatigueLevel: FatigueLevel;
  fatigueLabel: string;
  fatigueDescription: string;
  cityTransportModes: TransportMode[];
};

export const TRANSPORT_MODE_META: Record<
  TransportMode,
  { label: string; keywords: string[] }
> = {
  walk: { label: "Walk", keywords: ["walk", "on foot", "foot"] },
  metro: {
    label: "Metro",
    keywords: ["metro", "subway", "underground", "tube", "mrt", "tram"],
  },
  bus: { label: "Bus", keywords: ["bus", "shuttle"] },
  taxi: {
    label: "Car",
    keywords: ["taxi", "cab", "rideshare", "uber", "lyft", "grab", "car", "drive"],
  },
  bike: { label: "Bike", keywords: ["bike", "bicycle", "cycle", "scooter"] },
};

type InsightItem = {
  type: string;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  duration?: string | null;
  placeCache?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

const STREET_FACTOR = 1.35;
const STEPS_PER_ACTIVITY = 750;
const STEPS_PER_FOOD = 350;

const FATIGUE_META: Record<
  FatigueLevel,
  { label: string; description: string; score: number }
> = {
  easy: {
    label: "Easy day",
    description: "Light walking — you'll have energy left for a relaxed evening.",
    score: 1,
  },
  moderate: {
    label: "Moderate pace",
    description: "A full day on your feet — plan a sit-down meal and short breaks.",
    score: 2,
  },
  tiring: {
    label: "Tiring day",
    description: "Lots of ground to cover — wear comfortable shoes and start early.",
    score: 3,
  },
  exhausting: {
    label: "Very exhausting",
    description: "Marathon day — consider trimming a stop or using rideshare between areas.",
    score: 4,
  },
};

function itemCoords(item: InsightItem): { lat: number; lng: number } | null {
  const lat = item.latitude ?? item.placeCache?.latitude;
  const lng = item.longitude ?? item.placeCache?.longitude;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function isLongDistanceTransport(item: InsightItem) {
  const t = item.type.toLowerCase();
  const title = item.title.toLowerCase();
  if (!t.includes("transport")) return false;
  return (
    title.includes("flight") ||
    title.includes("drive") ||
    title.includes("road trip") ||
    title.includes("train to") ||
    title.includes("bus to")
  );
}

function isOnFootItem(item: InsightItem) {
  const t = item.type.toLowerCase();
  return (
    t.includes("activity") ||
    t.includes("food") ||
    t.includes("attraction") ||
    (!t.includes("transport") && !t.includes("lodging"))
  );
}

function parseDurationMinutes(duration: string | null | undefined): number {
  if (!duration) return 60;
  let mins = 0;
  const h = duration.match(/([\d.]+)\s*h(?:our)?/i);
  const m = duration.match(/(\d+)\s*m(?:in)?/i);
  if (h) mins += Math.round(parseFloat(h[1]) * 60);
  if (m) mins += parseInt(m[1]);
  return mins || 60;
}

function resolveFatigueLevel(
  estimatedSteps: number,
  activityCount: number,
  activeMinutes: number,
): FatigueLevel {
  let score = 0;
  if (estimatedSteps >= 7000) score += 3;
  else if (estimatedSteps >= 5000) score += 2;
  else if (estimatedSteps >= 3500) score += 1;

  if (activityCount >= 6) score += 2;
  else if (activityCount >= 4) score += 1;

  if (activeMinutes >= 480) score += 2;
  else if (activeMinutes >= 360) score += 1;

  if (score >= 5) return "exhausting";
  if (score >= 3) return "tiring";
  if (score >= 1) return "moderate";
  return "easy";
}

const TRANSPORT_MODE_ORDER: TransportMode[] = [
  "walk",
  "metro",
  "bus",
  "taxi",
  "bike",
];

export function parseTransportModes(text: string | null | undefined): TransportMode[] {
  if (!text?.trim()) return [];

  const normalized = text.toLowerCase();
  const matched = TRANSPORT_MODE_ORDER.filter((mode) =>
    TRANSPORT_MODE_META[mode].keywords.some((keyword) =>
      normalized.includes(keyword),
    ),
  );

  return matched.length > 0 ? matched : ["taxi"];
}

function buildCityTransportModes(
  walkingDistanceKm: number,
  stopCount: number,
  storedRecommendation?: string | null,
): TransportMode[] {
  if (storedRecommendation?.trim()) {
    return parseTransportModes(storedRecommendation);
  }

  if (stopCount <= 1) {
    return ["walk", "taxi"];
  }

  const avgLegKm = walkingDistanceKm / Math.max(1, stopCount - 1);

  if (avgLegKm <= 0.8 && walkingDistanceKm <= 4) {
    return ["walk", "taxi"];
  }

  if (avgLegKm <= 2 && walkingDistanceKm <= 8) {
    return ["walk", "metro", "bus", "taxi"];
  }

  if (walkingDistanceKm > 8 || avgLegKm > 2.5) {
    return ["metro", "bus", "taxi"];
  }

  return ["walk", "metro", "bus", "taxi"];
}

export function computeDayInsights(
  items: InsightItem[],
  options?: {
    destination?: string;
    cityTransport?: string | null;
  },
): DayInsights {
  const routableItems = items.filter((item) => !isLongDistanceTransport(item));
  const coords = routableItems
    .map(itemCoords)
    .filter((c): c is { lat: number; lng: number } => c != null);

  let walkingDistanceKm = 0;
  for (let i = 1; i < coords.length; i++) {
    walkingDistanceKm += haversineKm(coords[i - 1], coords[i]) * STREET_FACTOR;
  }

  const activityCount = routableItems.filter(
    (item) => item.type.toLowerCase().includes("activity") || isOnFootItem(item),
  ).length;
  const foodCount = routableItems.filter((item) =>
    item.type.toLowerCase().includes("food"),
  ).length;

  const onsiteSteps =
    activityCount * STEPS_PER_ACTIVITY + foodCount * STEPS_PER_FOOD;
  const estimatedSteps = Math.max(
    routableItems.length > 0 ? 1500 : 0,
    onsiteSteps,
  );

  const activeMinutes = routableItems.reduce(
    (sum, item) => sum + parseDurationMinutes(item.duration),
    0,
  );

  const fatigueLevel = resolveFatigueLevel(
    estimatedSteps,
    activityCount,
    activeMinutes,
  );
  const fatigue = FATIGUE_META[fatigueLevel];

  const cityTransportModes = buildCityTransportModes(
    walkingDistanceKm,
    coords.length,
    options?.cityTransport,
  );

  return {
    estimatedSteps,
    walkingDistanceKm: Math.round(walkingDistanceKm * 10) / 10,
    fatigueLevel,
    fatigueLabel: fatigue.label,
    fatigueDescription: fatigue.description,
    cityTransportModes,
  };
}

export function formatStepCount(steps: number): string {
  if (steps >= 1000) {
    const rounded = Math.round(steps / 100) * 100;
    return `~${(rounded / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `~${Math.round(steps / 100) * 100}`;
}

export function getFatigueColor(level: FatigueLevel): string {
  switch (level) {
    case "easy":
      return "#059669";
    case "moderate":
      return "#2563eb";
    case "tiring":
      return "#ca8a04";
    case "exhausting":
      return "#dc2626";
  }
}

export function getFatigueLabel(level: FatigueLevel): string {
  return FATIGUE_META[level].label;
}

export function getFatigueDescription(level: FatigueLevel): string {
  return FATIGUE_META[level].description;
}
