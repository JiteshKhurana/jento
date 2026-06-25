const CACHE_VERSION = "v1";
const SHELL_CACHE = `jento-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `jento-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `jento-images-${CACHE_VERSION}`;

const ALL_CACHES = [SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE];

// App shell pages to pre-cache on install
const SHELL_URLS = ["/"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {
        // Pre-caching is best-effort; don't block install on failure
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Delete caches from previous versions
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => !ALL_CACHES.includes(key))
              .map((key) => caches.delete(key)),
          ),
        ),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) {
    // For cross-origin images (e.g. Unsplash, Google Places), cache them
    if (request.destination === "image") {
      event.respondWith(cacheFirstImage(request));
    }
    return;
  }

  // Never cache API routes, auth routes, or webhooks
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/sign-in") ||
    url.pathname.startsWith("/sign-up") ||
    url.pathname.startsWith("/_next/webpack-hmr")
  ) {
    return;
  }

  // Cache-first for hashed Next.js static assets (safe because filenames include content hash)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  // Cache-first for icons and other public static assets
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/landing/") ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
  ) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // Network-first for HTML pages — always try to get fresh content
  event.respondWith(networkFirstPage(request));
});

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function cacheFirstImage(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a cached icon as fallback for broken images
    return (
      (await caches.match("/icons/icon-192.png")) ||
      new Response("", { status: 404 })
    );
  }
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Ultimate fallback: return the root page from cache
    return (
      (await caches.match("/")) || new Response("Offline", { status: 503 })
    );
  }
}

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Jento", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    tag: data.tag || "jento-notification",
    renotify: true,
    data: { url: data.url || "/" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Jento", options),
  );
});

// Notification click handler — focus existing tab or open new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      }),
  );
});
