/* ============================================================
   Service worker — mise en cache pour l'usage hors-ligne
   Important : le cache ne contient QUE des fichiers de l'app.
   Les données utilisateur vivent dans localStorage et ne sont
   jamais touchées ici — une mise à jour ne les efface pas.
   ============================================================ */
importScripts('./js/version.js');

const CACHE_NAME = 'nousdeux-cache-v' + (self.APP_VERSION || '0');

// Liste fermée des fichiers de l'application. Aucune autre requête n'est
// mise en cache : une future API n'y sera jamais ajoutée par erreur, et une
// erreur réseau sur une requête hors de cette liste ne sera jamais masquée
// par une réponse HTML de repli.
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
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isAsset = isSameOrigin && ASSETS.some((a) => new URL(a, self.location.href).pathname === url.pathname);

  if (isAsset) {
    // Fichiers de l'app : cache d'abord (rapide, fonctionne hors-ligne),
    // avec mise à jour silencieuse du cache en arrière-plan.
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((response) => {
          if (response && response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, response.clone()));
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (req.mode === 'navigate') {
    // Navigation vers une page de l'app (ex. ouverture depuis l'écran
    // d'accueil) : on tente le réseau, et on retombe sur la page mise en
    // cache pour rester utilisable hors-ligne.
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Tout le reste (futures requêtes d'API, ressources externes…) n'est ni
  // intercepté ni mis en cache : le navigateur les traite normalement, sans
  // qu'une erreur réseau ne soit jamais transformée en réponse HTML.
});
