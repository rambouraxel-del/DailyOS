/* ============================================================
   Service worker — mise en cache pour l'usage hors-ligne
   Important : le cache ne contient QUE des fichiers de l'app.
   Les données utilisateur vivent dans localStorage et ne sont
   jamais touchées ici — une mise à jour ne les efface pas.
   ============================================================ */
const CACHE_NAME = 'nousdeux-v1.0.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/version.js',
  './js/config.js',
  './js/dates.js',
  './js/storage.js',
  './js/ui.js',
  './js/themes.js',
  './js/stickers.js',
  './js/event-form.js',
  './js/views/home.js',
  './js/views/agenda.js',
  './js/views/settings.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Réseau d'abord, cache en secours : l'app reste à jour
  // tout en fonctionnant sans connexion.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match('./index.html')))
  );
});
