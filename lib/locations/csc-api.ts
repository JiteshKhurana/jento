const CSC_BASE = "https://api.countrystatecity.in/v1";

type CscCountry = {
  id: string;
  name: string;
  iso2: string;
  emoji?: string;
};

type CscState = {
  id: string;
  name: string;
  iso2: string;
  country_code: string;
};

type CscCity = {
  id: string;
  name: string;
};

let countriesCache: CscCountry[] | null = null;
const statesCache = new Map<string, CscState[]>();
const citiesCache = new Map<string, CscCity[]>();

function getApiKey() {
  const key = process.env.CSC_API_KEY;
  if (!key) throw new Error("CSC_API_KEY is not configured");
  return key;
}

async function cscFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${CSC_BASE}${path}`, {
    headers: { "X-CSCAPI-KEY": getApiKey() },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CSC API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function getCscCountries() {
  if (!countriesCache) {
    countriesCache = await cscFetch<CscCountry[]>("/countries");
  }
  return countriesCache;
}

export async function getCscStates(countryCode: string) {
  const key = countryCode.toUpperCase();
  if (!statesCache.has(key)) {
    statesCache.set(key, await cscFetch<CscState[]>(`/countries/${key}/states`));
  }
  return statesCache.get(key)!;
}

export async function getCscCities(countryCode: string, stateCode: string) {
  const key = `${countryCode.toUpperCase()}/${stateCode.toUpperCase()}`;
  if (!citiesCache.has(key)) {
    citiesCache.set(
      key,
      await cscFetch<CscCity[]>(
        `/countries/${countryCode.toUpperCase()}/states/${stateCode.toUpperCase()}/cities`,
      ),
    );
  }
  return citiesCache.get(key)!;
}
