import { City, Country, State } from "country-state-city";

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

function buildLabel(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(", ");
}

export function searchLocations(query: string, limit = 10): LocationSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: LocationSuggestion[] = [];
  const seen = new Set<string>();

  function push(result: LocationSuggestion) {
    if (seen.has(result.id)) return;
    seen.add(result.id);
    results.push(result);
  }

  for (const country of Country.getAllCountries()) {
    if (!country.name.toLowerCase().includes(q)) continue;
    push({
      id: `country-${country.isoCode}`,
      name: country.name,
      label: country.name,
      type: "country",
      countryCode: country.isoCode,
      latitude: country.latitude ?? undefined,
      longitude: country.longitude ?? undefined,
    });
    if (results.length >= limit) return results;
  }

  for (const state of State.getAllStates()) {
    if (!state.name.toLowerCase().includes(q)) continue;
    const country = Country.getCountryByCode(state.countryCode);
    push({
      id: `state-${state.countryCode}-${state.isoCode}`,
      name: state.name,
      label: buildLabel([state.name, country?.name]),
      type: "state",
      countryCode: state.countryCode,
      stateCode: state.isoCode,
      latitude: state.latitude ?? undefined,
      longitude: state.longitude ?? undefined,
    });
    if (results.length >= limit) return results;
  }

  for (const city of City.getAllCities()) {
    if (!city.name.toLowerCase().includes(q)) continue;
    const state = city.stateCode
      ? State.getStateByCodeAndCountry(city.stateCode, city.countryCode)
      : undefined;
    const country = Country.getCountryByCode(city.countryCode);
    push({
      id: `city-${city.countryCode}-${city.stateCode ?? "na"}-${city.name}`,
      name: city.name,
      label: buildLabel([city.name, state?.name, country?.name]),
      type: "city",
      countryCode: city.countryCode,
      stateCode: city.stateCode,
      latitude: city.latitude ?? undefined,
      longitude: city.longitude ?? undefined,
    });
    if (results.length >= limit) return results;
  }

  return results;
}
