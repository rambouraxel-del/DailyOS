// Mise à jour forcée de l'app shell (Cache Storage + service worker).
//
// GARANTIE IMPORTANTE : ce module ne lit ni n'écrit jamais le localStorage.
// Il n'appelle jamais localStorage.clear()/removeItem(), ni
// indexedDB.deleteDatabase(), ni aucune fonction de reset des données
// (voir storage.resetAll() qui reste la SEULE façon d'effacer les données
// utilisateur, et qui n'est jamais appelée ici). Il agit uniquement sur le
// Cache Storage du navigateur (fichiers de l'app shell mis en cache par le
// service worker) et sur le cycle de vie du service worker lui-même.

/**
 * Vide les caches applicatifs DailyOS (Cache Storage) et demande au service
 * worker de vérifier/activer la dernière version. Ne touche jamais aux
 * données utilisateur stockées en localStorage.
 */
export async function clearAppCacheAndPrepareUpdate() {
  if (typeof caches !== "undefined") {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      try {
        await registration.update();
      } catch {
        // pas bloquant : on aura quand même vidé le cache et on rechargera.
      }
      if (registration.waiting) {
        registration.waiting.postMessage("SKIP_WAITING");
      }
    }
  }
}

/**
 * Recharge l'application sur une URL "fraîche" (paramètre anti-cache) pour
 * forcer la récupération des derniers fichiers déployés. Le paramètre est
 * ignoré par le routeur interne de l'app (basé sur l'état JS, pas sur
 * l'URL) : il ne casse donc ni la navigation ni l'installation PWA.
 */
export function reloadFreshApp() {
  const url = `${window.location.pathname}?refresh=${Date.now()}`;
  window.location.href = url;
}
