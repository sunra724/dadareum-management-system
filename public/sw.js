const CACHE_NAME = "dadareum-study-cafe-v1";
const APP_SHELL = [
  "/study-cafe/checkin",
  "/study-cafe/my",
  "/manifest.webmanifest",
  "/study-cafe-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isPublicYouthPage = url.pathname === "/study-cafe/checkin" || url.pathname === "/study-cafe/my";
  if (!isPublicYouthPage && url.pathname !== "/manifest.webmanifest" && url.pathname !== "/study-cafe-icon.svg") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/study-cafe/checkin"))),
  );
});
