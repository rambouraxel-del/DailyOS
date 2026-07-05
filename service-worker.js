// Service worker DailyOS : met en cache l'app shell pour un fonctionnement hors ligne.
// Incrémenter CACHE_NAME à chaque changement de fichiers pour forcer la mise à jour du cache.
const CACHE_NAME = "dailyos-cache-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./js/storage.js",
  "./js/date-utils.js",
  "./js/weather.js",
  "./js/icons.js",
  "./js/components.js",
  "./js/modal.js",
  "./js/views/home.js",
  "./js/views/tasks.js",
  "./js/views/planning.js",
  "./js/views/projects.js",
  "./js/views/groceries.js",
  "./js/views/notes.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // Requêtes externes (météo) : réseau uniquement, pas de mise en cache.
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return cached;
        });
    })
  );
});
