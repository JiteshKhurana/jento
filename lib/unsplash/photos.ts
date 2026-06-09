const UNSPLASH_API = "https://api.unsplash.com";

export type UnsplashPhoto = {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
};

type UnsplashApiPhoto = {
  urls: { regular: string };
  alt_description: string | null;
  description: string | null;
  user: { name: string; links: { html: string } };
};

const DEFAULT_QUERY = "travel destination";

function toPhoto(photo: UnsplashApiPhoto): UnsplashPhoto {
  const url = new URL(photo.urls.regular);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", "800");
  url.searchParams.set("q", "80");

  return {
    url: url.toString(),
    alt: photo.alt_description ?? photo.description ?? "Travel destination",
    photographer: photo.user.name,
    photographerUrl: `${photo.user.links.html}?utm_source=tripzy&utm_medium=referral`,
  };
}

async function fetchUnsplash(
  path: string,
  params: Record<string, string>,
  accessKey: string,
): Promise<UnsplashApiPhoto | null> {
  const url = new URL(`${UNSPLASH_API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (Array.isArray(data.results)) {
    return data.results[0] ?? null;
  }
  return data.id ? data : null;
}

export async function getUnsplashPhoto(query?: string): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const searchQuery = query?.trim() || DEFAULT_QUERY;
  const params = {
    query: searchQuery,
    per_page: "1",
    orientation: "portrait",
    content_filter: "high",
  };

  let photo = await fetchUnsplash("/search/photos", params, accessKey);

  if (!photo && searchQuery !== DEFAULT_QUERY) {
    photo = await fetchUnsplash("/search/photos", { ...params, query: DEFAULT_QUERY }, accessKey);
  }

  if (!photo) {
    photo = await fetchUnsplash(
      "/photos/random",
      { query: searchQuery, orientation: "portrait", content_filter: "high" },
      accessKey,
    );
  }

  return photo ? toPhoto(photo) : null;
}
