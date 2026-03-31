// IMPORTANT: cache only same-origin static assets.
// Do NOT cache API calls (Supabase, AI, etc.) or HTML navigations aggressively.
const CACHE_NAME = "edusphere-v3";
const APP_SHELL = ["/", "/manifest.json", "/favicon.ico", "/icon-192.png", "/icon-512.png"];

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isStaticRequest(request) {
  if (!isSameOrigin(request.url)) return false;
  const dest = request.destination;
  return dest === "script" || dest === "style" || dest === "image" || dest === "font" || dest === "manifest";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const req = event.request;

  // Navigation: network-first, fallback to cached app shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/"))
    );
    return;
  }

  // Static assets: cache-first.
  if (isStaticRequest(req)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
          return response;
        });
      })
    );
    return;
  }

  // Anything else (including cross-origin / API calls): network only.
  return;
});
