# DailyOS - Organisation personnelle

Application web progressive (PWA) mobile-first, 100% locale : aucune inscription,
aucun compte, aucun serveur. Toutes les données (tâches, planning, projets,
courses, notes) sont stockées dans le `localStorage` du téléphone.

## Lancer le projet en local

Aucune installation ni build n'est nécessaire (HTML/CSS/JS vanilla, modules ES).
Il suffit de servir le dossier avec un serveur statique (obligatoire pour que
les `import` de modules JS et le service worker fonctionnent — l'ouverture
directe du fichier `index.html` via `file://` ne fonctionnera pas).

Avec Python (déjà installé sur la plupart des machines) :

```bash
cd DailyOS
python3 -m http.server 8080
```

Puis ouvrir http://localhost:8080 dans le navigateur.

Autres options équivalentes :

```bash
npx serve .
# ou
npx http-server -p 8080
```

## Tester sur téléphone

1. Assure-toi que ton ordinateur et ton téléphone sont sur le même réseau Wi-Fi.
2. Lance le serveur local en écoutant sur toutes les interfaces, par exemple :
   `python3 -m http.server 8080` (par défaut déjà accessible depuis le réseau local).
3. Récupère l'adresse IP locale de ton ordinateur (ex : `192.168.1.23`).
4. Sur ton téléphone, ouvre `http://192.168.1.23:8080` dans Safari (iPhone) ou
   Chrome (Android).

> Remarque : la géolocalisation et l'installation PWA nécessitent en général un
> contexte sécurisé (HTTPS) ou `localhost`. Pour un test complet sur un vrai
> téléphone (météo par géolocalisation, installation), il est recommandé de
> déployer l'app sur un hébergeur statique gratuit en HTTPS (GitHub Pages,
> Netlify, Vercel, Cloudflare Pages…) — il suffit de pousser ce dossier tel quel,
> il n'y a rien à builder.

## Ajouter à l'écran d'accueil

**iPhone (Safari) :**
1. Ouvrir l'app dans Safari.
2. Appuyer sur le bouton de partage (carré avec flèche vers le haut).
3. Choisir « Sur l'écran d'accueil ».
4. Valider — l'icône DailyOS apparaît sur l'écran d'accueil et l'app s'ouvre en
   plein écran (sans barre d'adresse) au prochain lancement.

**Android (Chrome) :**
1. Ouvrir l'app dans Chrome.
2. Menu (⋮) → « Ajouter à l'écran d'accueil » ou bannière d'installation
   automatique proposée par Chrome.

## Structure du projet

```
DailyOS/
├── index.html              Squelette HTML unique (SPA), meta PWA, nav bar
├── manifest.json            Manifest PWA (nom, icônes, couleurs, mode standalone)
├── service-worker.js        Cache de l'app shell pour le fonctionnement hors ligne
├── css/
│   └── styles.css           Toute la feuille de style (thème néon glassmorphism)
├── js/
│   ├── app.js                Routeur SPA + délégation d'événements (le "chef d'orchestre")
│   ├── storage.js             Modèle de données + CRUD + persistance localStorage
│   ├── date-utils.js          Formatage des dates en français, semaine ISO
│   ├── weather.js              Appel à l'API météo Open-Meteo (gratuite, sans clé)
│   ├── icons.js                Icônes SVG inline (aucune dépendance externe)
│   ├── components.js           Petits fragments HTML réutilisés (lignes cochables…)
│   ├── modal.js                 Modale d'ajout rapide "+" et modale Paramètres
│   └── views/
│       ├── home.js               Vue Accueil (dashboard)
│       ├── tasks.js               Vue Tâches
│       ├── planning.js            Vue Planning (timeline journalière)
│       ├── projects.js            Vue Projets (façon mini-Notion)
│       ├── groceries.js           Vue Courses
│       └── notes.js               Vue Notes
└── icons/                    Icônes PWA (192, 512, apple-touch-icon)
```

Aucun bundler, aucune dépendance npm : tout tourne avec des modules ES natifs
du navigateur (`<script type="module">`), ce qui garde le projet simple à lire,
déboguer et modifier.

## Où modifier les couleurs / le style

Tout le design vit dans **`css/styles.css`**. Les couleurs, dégradés, rayons
d'arrondi et ombres sont centralisés en haut du fichier dans le bloc
`:root { ... }` (section « Design tokens ») :

```css
--violet: #8b5cf6;
--pink: #ec4899;
--blue: #3b82f6;
--grad-primary: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
--radius-lg: 22px;
```

Changer une variable ici met à jour toute l'application (boutons, cartes,
icônes colorées, bouton "+", etc.) car tous les composants réutilisent ces
variables.

## Où modifier les données initiales

Les exemples pré-remplis (tâches, événements, projets, courses, notes) sont
définis dans la fonction `seedData()` du fichier **`js/storage.js`**. Cette
fonction n'est utilisée que si aucune donnée n'existe encore dans le
`localStorage` du navigateur (premier lancement, ou après réinitialisation).

## Comment fonctionne le stockage local

- Toutes les données sont regroupées dans un seul objet JavaScript avec la
  forme suivante (voir `js/storage.js`) :

  ```js
  {
    tasks: [],
    events: [],
    projects: [],
    groceries: [],
    notes: [],
    settings: { city: "", weatherEnabled: true, lastWeather: null },
  }
  ```

- Cet objet est sérialisé en JSON et sauvegardé sous la clé `dailyos:data`
  dans le `localStorage` du navigateur, à chaque modification (ajout,
  suppression, coche, édition…) via la fonction interne `persist()`.
- Au chargement de l'app, `js/storage.js` relit cette clé et restaure l'état
  tel quel ; si elle est absente ou invalide, les données d'exemple sont
  regénérées.
- Un bouton **Réinitialiser les données** est disponible dans les Paramètres
  (icône ⚙️ en haut à droite de l'Accueil) pour tout effacer et repartir des
  données d'exemple.

⚠️ Les données étant stockées uniquement dans le navigateur utilisé, elles ne
sont pas synchronisées entre appareils et peuvent être perdues si le
cache/stockage du navigateur est vidé manuellement.

## Météo

La météo utilise l'API gratuite [Open-Meteo](https://open-meteo.com/) (aucune
clé requise) :
1. L'app demande d'abord la géolocalisation du navigateur.
2. Si elle est refusée/indisponible, elle utilise la ville renseignée dans
   Paramètres (ou « Paris » par défaut).
3. Si aucune des deux ne fonctionne (pas de réseau, ville introuvable…), la
   carte affiche proprement « Météo indisponible ».

## Notes techniques

- Aucune tâche, aucun événement, aucune note liée à des finances : cette
  fonctionnalité a été volontairement exclue, conformément au cahier des
  charges.
- L'app est pensée mobile-first (largeur max ~480px, zones tactiles larges,
  `safe-area-inset` pour les encoches/barres iOS).
- Le service worker met en cache les fichiers essentiels au premier chargement
  afin que l'app puisse se rouvrir hors connexion. Si tu modifies un fichier
  du "shell" (HTML/CSS/JS), pense à incrémenter `CACHE_NAME` dans
  `service-worker.js` pour forcer la mise à jour du cache chez les
  utilisateurs.
