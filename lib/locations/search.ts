const PLACES_API_BASE = "https://places.googleapis.com/v1";

export type LocationSuggestion = {
  id: string;
  name: string;
  label: string;
  type: "city" | "state" | "country";
  countryCode: string;
  stateCode?: string;
  latitude?: string;
  longitude?: string;
};

type AutocompleteSuggestion = {
  placePrediction?: {
    placeId?: string;
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
    types?: string[];
  };
};

type PlaceDetailsMinimal = {
  primaryType?: string;
  types?: string[];
  location?: { latitude: number; longitude: number };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
};

function getApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    null
  );
}

function getAddressComponent(
  components: PlaceDetailsMinimal["addressComponents"],
  type: string,
) {
  return components?.find((component) => component.types?.includes(type));
}

function inferLocationType(
  primaryType?: string,
  types?: string[],
): LocationSuggestion["type"] {
  const allTypes = [primaryType, ...(types ?? [])].filter(Boolean);
  if (allTypes.includes("country")) return "country";
  if (allTypes.includes("administrative_area_level_1")) return "state";
  return "city";
}

async function fetchPlaceDetailsMinimal(
  placeId: string,
  apiKey: string,
): Promise<PlaceDetailsMinimal | null> {
  const apiPlaceId = placeId.startsWith("places/") ? placeId : `places/${placeId}`;

  const res = await fetch(`${PLACES_API_BASE}/${apiPlaceId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "primaryType,types,location,addressComponents",
    },
  });

  if (!res.ok) {
    console.error("Place details failed:", await res.text());
    return null;
  }

  return res.json() as Promise<PlaceDetailsMinimal>;
}

export async function searchLocations(
  query: string,
  limit = 10,
): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Google Maps API key is not configured");
    return [];
  }

  const res = await fetch(`${PLACES_API_BASE}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types",
    },
    body: JSON.stringify({
      input: q,
      includedPrimaryTypes: ["locality", "administrative_area_level_1", "country"],
      languageCode: "en",
    }),
  });

  if (!res.ok) {
    console.error("Places autocomplete failed:", await res.text());
    return [];
  }

  const data = (await res.json()) as { suggestions?: AutocompleteSuggestion[] };
  const predictions = (data.suggestions ?? [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> =>
      Boolean(prediction?.placeId),
    )
    .slice(0, Math.min(limit, 5));

  if (predictions.length === 0) return [];

  const details = await Promise.all(
    predictions.map((prediction) =>
      fetchPlaceDetailsMinimal(prediction.placeId!, apiKey),
    ),
  );

  return predictions.map((prediction, index) => {
    const detail = details[index];
    const name =
      prediction.structuredFormat?.mainText?.text ?? prediction.placeId!;
    const secondary = prediction.structuredFormat?.secondaryText?.text;
    const label = secondary ? `${name}, ${secondary}` : name;
    const country = getAddressComponent(detail?.addressComponents, "country");
    const state = getAddressComponent(
      detail?.addressComponents,
      "administrative_area_level_1",
    );

    return {
      id: prediction.placeId!,
      name,
      label,
      type: inferLocationType(
        detail?.primaryType,
        prediction.types ?? detail?.types,
      ),
      countryCode: country?.shortText ?? "",
      stateCode: state?.shortText,
      latitude: detail?.location?.latitude?.toString(),
      longitude: detail?.location?.longitude?.toString(),
    };
  });
}
