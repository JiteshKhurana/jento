import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";

function getGeocodingApiKey() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_PLACES_API_KEY ??
    null
  );
}

export async function GET(req: Request) {
  try {
    await requireCurrentDbUser();

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
    }

    const apiKey = getGeocodingApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Geocoding not configured" }, { status: 503 });
    }

    const geocodeUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    geocodeUrl.searchParams.set("latlng", `${lat},${lng}`);
    geocodeUrl.searchParams.set("key", apiKey);

    const res = await fetch(geocodeUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
    }

    const data = (await res.json()) as {
      status?: string;
      error_message?: string;
      results?: Array<{
        formatted_address?: string;
        address_components?: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
      }>;
    };

    if (data.status !== "OK") {
      console.error("Geocoding API error:", data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message ?? `Geocoding failed: ${data.status ?? "unknown"}` },
        { status: 502 },
      );
    }

    const result = data.results?.[0];
    if (!result) {
      return NextResponse.json({ error: "No location found" }, { status: 404 });
    }

    const components = result.address_components ?? [];
    const locality =
      components.find((c) => c.types.includes("locality"))?.long_name ??
      components.find((c) => c.types.includes("postal_town"))?.long_name ??
      components.find((c) => c.types.includes("administrative_area_level_2"))?.long_name;
    const region = components.find((c) =>
      c.types.includes("administrative_area_level_1"),
    )?.long_name;
    const country = components.find((c) => c.types.includes("country"))?.long_name;

    const name = locality ?? region ?? country ?? "Current location";
    const label = [locality, region, country].filter(Boolean).join(", ");

    return NextResponse.json({
      name,
      label: label || result.formatted_address || name,
      latitude: Number.parseFloat(lat),
      longitude: Number.parseFloat(lng),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to reverse geocode" }, { status: 500 });
  }
}
