// Service worker DailyOS : met en cache l'app shell pour un fonctionnement hors ligne.
//
// Nom de cache versionné : CACHE_NAME doit être incrémenté ("dailyos-cache-v3",
// "v4"...) à chaque déploiement qui change un fichier de l'app shell listé
// ci-dessous. À l'activation, tous les caches DailyOS dont le nom ne
// correspond plus à CACHE_NAME sont automatiquement supprimés (voir plus bas).
// Ce mécanisme ne touche jamais au localStorage : les données utilisateur
// (tâches, planning, projets, courses, notes, paramètres) ne sont jamais
// stockées ici et ne sont donc jamais concernées par ce nettoyage.
const CACHE_NAME = "dailyos-cache-v4";

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
  "./js/update.js",
  "./js/version.js",
  "./js/views/home.js",
  "./js/views/tasks.js",
  "./js/views/planning.js",
  "./js/views/projects.js",
  "./js/views/groceries.js",
  "./js/views/notes.js",
  "./js/views/notes-editor.js",
  "./js/views/notes-tree.js",
  "./js/views/notes-mindmap.js",
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
      // supprime uniquement les caches DailyOS (Cache Storage) obsolètes —
      // n'affecte jamais le localStorage où vivent les données utilisateur.
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Permet à la page (bouton "Vider le cache et mettre à jour" des Paramètres)
// de demander l'activation immédiate d'un service worker en attente.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING" || event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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
