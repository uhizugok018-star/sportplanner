const CACHE = "sportplanner-v2";
const ASSETS = [
  "/index.html",
  "/app.js",
  "/setup.html",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // API requests: network only (don't cache AI calls)
  if (url.hostname.includes("openrouter.ai") || url.hostname.includes("yandex") || url.hostname.includes("functions.")) {
    return;
  }

  // App assets: cache-first, then network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return response;
      });
    })
  );
});