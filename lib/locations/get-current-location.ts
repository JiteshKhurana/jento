import type { TripLocationPreference } from "@/lib/trips/preferences";

export async function getCurrentLocation(): Promise<TripLocationPreference | null> {
  if (typeof window === "undefined" || !navigator.geolocation) return null;
  if (!window.isSecureContext) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const params = new URLSearchParams({
            lat: String(latitude),
            lng: String(longitude),
          });
          const res = await fetch(`/api/locations/reverse?${params}`);
          if (res.ok) {
            const data = (await res.json()) as {
              name: string;
              label: string;
              latitude?: number;
              longitude?: number;
            };
            resolve({
              name: data.name,
              label: data.label,
              latitude: String(data.latitude ?? latitude),
              longitude: String(data.longitude ?? longitude),
            });
            return;
          }
        } catch {
          // Fall back to coordinates below.
        }

        resolve({
          name: "Current location",
          label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          latitude: String(latitude),
          longitude: String(longitude),
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}
