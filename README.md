# Nous Deux 💞

L'agenda partagé du couple : organisez vos sorties, vos dates et vos activités
à deux, autour d'un calendrier central.

Application web (PWA) sans dépendance : HTML / CSS / JavaScript vanilla.
Elle s'installe sur mobile et fonctionne hors connexion.

## Fonctionnalités

### Agenda central — 3 vues
- **Mois** : grille calendrier, pastilles de couleur par événement, autocollants visibles.
- **Semaine** : les 7 jours en liste, avec ajout rapide sur chaque journée.
- **Jour** : timeline horaire (7h → minuit) avec les événements positionnés à leur heure.

Navigation par flèches, bouton « Aujourd'hui », et la vue choisie est mémorisée.

### Événements
4 types : **Anniversaire** 🎂 · **Date** 💕 · **Soirée** 🎉 · **Sortie** 🌿

Chaque événement contient : titre, type, date, heure de début et de fin,
couleur (8 teintes), **lieu**, **participant** (l'un, l'autre, ou nous deux),
**rappel**, et une **note libre**.

### Décoration
Une palette de 35 autocollants (cœurs, étoiles, fleurs, voyages…) à poser sur
n'importe quelle journée. Ils s'affichent dans le calendrier et sont conservés.

### Thèmes
5 thèmes complets : **Clair**, **Sombre**, **Amour** (rose), **Nature** (vert),
**Espace** (violet étoilé). Le choix est mémorisé.

## Mémoire interne

Vos données sont stockées **uniquement sur cet appareil**, dans `localStorage`.
Elles ne sont envoyées nulle part. L'application est conçue pour ne jamais les
perdre silencieusement entre deux sessions ou après une mise à jour, mais rien
ne remplace une sauvegarde régulière (export JSON) — notamment avant de
changer d'appareil ou de vider le navigateur.

- Stockage sous un **schéma versionné** (`SCHEMA_VERSION`, actuellement 2).
- **Migrations automatiques** : une sauvegarde écrite par une ancienne version
  est convertie au démarrage, jamais effacée.
- **Copie de secours** écrite avant chaque enregistrement, relue si la clé
  principale devient illisible.
- **Normalisation défensive** : une donnée corrompue ou partielle est réparée
  plutôt que rejetée (seule une date irrécupérable fait perdre un événement).
- **Écritures fiabilisées** : `Storage.saveEvent()` (et les autres mutations)
  renvoient `{ ok, ... }` ; l'interface n'affiche jamais un message de succès
  si l'écriture sur le disque a réellement échoué (stockage plein, accès
  refusé…). En cas d'échec, l'état en mémoire est annulé (rollback) pour
  rester cohérent avec ce qui est vraiment sur le disque.
- **Export / import JSON** depuis les Réglages. L'import prévient avant de
  remplacer les données actuelles et conserve une copie de secours de l'état
  précédent (`nousdeux.data.pre-import`) avant d'écraser quoi que ce soit.
- Le service worker ne met en cache qu'une liste fermée de fichiers de
  l'application ; il ne touche jamais aux données utilisateur et ne
  transforme jamais une erreur réseau en réponse HTML hors des navigations.

## Tests

Tests unitaires, zéro dépendance :

```bash
node tests/run-unit.js
```

Couvrent : utilitaires de dates, validation, migrations de schéma,
réparation défensive des données corrompues, création/édition/suppression
d'événements, validation des horaires (journée entière, début seul,
début + fin, fin ≤ début rejetée), panne d'écriture simulée (quota), et
import/export JSON.

## Lancer l'application

Ouvrir `index.html` dans un navigateur.

Pour le mode hors-ligne (service worker), servir le dossier en HTTP :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Structure

```
index.html            Page unique
manifest.json         Manifeste PWA
service-worker.js     Cache hors-ligne
css/styles.css        Thèmes + design
js/
  version.js          Version de l'app
  config.js           Types d'événements, couleurs, stickers, thèmes
  dates.js            Utilitaires calendrier (FR, semaine au lundi)
  storage.js          Mémoire interne versionnée + migrations
  ui.js               Helpers DOM
  themes.js           Application du thème
  stickers.js         Palette d'autocollants
  event-form.js       Création / édition d'événement
  views/
    home.js           Accueil : prochains événements, compteurs
    agenda.js         Agenda : vues mois / semaine / jour
    settings.js       Réglages : thème, prénoms, sauvegarde
```
