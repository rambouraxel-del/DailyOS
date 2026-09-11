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

Aucune donnée ne se perd, ni entre deux sessions, ni après une mise à jour :

- Stockage `localStorage` sous un **schéma versionné** (`SCHEMA_VERSION`).
- **Migrations automatiques** : une sauvegarde écrite par une ancienne version
  est convertie au démarrage, jamais effacée.
- **Copie de secours** écrite avant chaque enregistrement, relue si la clé
  principale devient illisible.
- **Normalisation défensive** : une donnée corrompue ou partielle est réparée
  plutôt que rejetée.
- **Export / import JSON** depuis les Réglages, pour une sauvegarde manuelle
  ou un transfert vers un autre appareil.
- Le service worker ne met en cache que les fichiers de l'application ; il ne
  touche jamais aux données utilisateur.

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
