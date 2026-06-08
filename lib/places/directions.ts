type LatLng = { lat: number; lng: number };

export type DrivingRoute = {
  durationMinutes: number;
  durationText: string;
  distanceText?: string;
};

function getMapsApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );
}

export function formatDrivingDuration(totalMinutes: number): string {
  const minutes = Math.max(1, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function formatOrigin(origin: LatLng | string) {
  return typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`;
}

export async function getDrivingDuration(
  origin: LatLng | string,
  destination: LatLng | string,
): Promise<DrivingRoute | null> {
  const apiKey = getMapsApiKey();
  if (!apiKey) return null;

  const params = new URLSearchParams({
    origins: formatOrigin(origin),
    destinations: formatOrigin(destination),
    mode: "driving",
    key: apiKey,
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`,
  );

  if (!res.ok) {
    console.error("Distance Matrix failed:", await res.text());
    return null;
  }

  const data = (await res.json()) as {
    status: string;
    rows?: Array<{
      elements?: Array<{
        status: string;
        duration?: { text: string; value: number };
        distance?: { text: string };
      }>;
    }>;
  };

  const element = data.rows?.[0]?.elements?.[0];
  if (data.status !== "OK" || element?.status !== "OK" || !element.duration) {
    return null;
  }

  const durationMinutes = Math.ceil(element.duration.value / 60);

  return {
    durationMinutes,
    durationText: formatDrivingDuration(durationMinutes),
    distanceText: element.distance?.text,
  };
}
