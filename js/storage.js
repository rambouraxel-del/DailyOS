/* ============================================================
   Storage — mémoire interne versionnée
   Objectif : aucune donnée ne doit se perdre entre les sessions
   ni entre les mises à jour de l'application.

   Contrat de retour des écritures : toute fonction qui modifie les
   données (saveEvent, deleteEvent, addSticker, removeSticker,
   clearStickers, setSetting, importJSON, resetAll) renvoie
   { ok: true, value } ou { ok: false, code, message }.
   L'UI ne doit jamais afficher un message de succès sans avoir
   vérifié `ok === true`.
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'nousdeux.data';
  var BACKUP_KEY = 'nousdeux.data.backup';
  var PRE_IMPORT_KEY = 'nousdeux.data.pre-import';
  var SCHEMA_VERSION = 2;

  /* ---------- État par défaut ---------- */
  function defaultData() {
    return {
      version: SCHEMA_VERSION,
      settings: {
        theme: 'love',
        partnerA: 'Moi',
        partnerB: 'Toi',
        lastView: 'month'
      },
      events: [],
      stickers: []
    };
  }

  /* ---------- Migrations ----------
     Chaque migration transforme la donnée de la version N vers N+1.
     On n'en retire JAMAIS une : c'est ce qui garantit qu'une vieille
     sauvegarde reste lisible après n'importe quelle mise à jour.
  */
  var MIGRATIONS = {
    // 0 -> 1 : première version structurée
    0: function (data) {
      var base = defaultData();
      base.events = Array.isArray(data.events) ? data.events : [];
      base.stickers = Array.isArray(data.stickers) ? data.stickers : [];
      if (data.settings) {
        Object.keys(base.settings).forEach(function (k) {
          if (data.settings[k] !== undefined) base.settings[k] = data.settings[k];
        });
      }
      base.version = 1;
      return base;
    },
    // 1 -> 2 : introduction du champ explicite `allDay` (au lieu de déduire
    // "journée entière" de l'absence d'heure de début un peu partout dans le code)
    1: function (data) {
      data.events = (Array.isArray(data.events) ? data.events : []).map(function (e) {
        if (e && typeof e === 'object' && e.allDay === undefined) {
          e.allDay = !e.start;
        }
        return e;
      });
      data.version = 2;
      return data;
    }
  };

  function migrate(data) {
    var d = data;
    var guard = 0;
    while ((d.version || 0) < SCHEMA_VERSION && guard < 50) {
      var from = d.version || 0;
      var fn = MIGRATIONS[from];
      if (!fn) { d.version = SCHEMA_VERSION; break; }
      d = fn(d);
      if ((d.version || 0) <= from) d.version = from + 1;
      guard++;
    }
    return d;
  }

  /* ---------- Réparation défensive d'un événement ----------
     Répare autant que possible plutôt que de rejeter : seule une date
     absente ou incalculable rend un événement irrécupérable. */
  function sanitizeStoredEvent(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (!Dates.isValidDateKey(raw.date)) return null; // irréparable

    var type = Config.typeById(raw.type); // fallback interne déjà géré
    var typeId = Config.EVENT_TYPES.some(function (t) { return t.id === raw.type; }) ? raw.type : type.id;

    var title = (typeof raw.title === 'string' ? raw.title.trim() : '').slice(0, 120);
    if (!title) title = 'Événement';

    var color = (typeof raw.color === 'string' && /^#[0-9a-f]{6}$/i.test(raw.color))
      ? raw.color
      : Config.typeById(typeId).color;

    var who = Config.WHO.some(function (w) { return w.id === raw.who; }) ? raw.who : 'both';
    var reminder = Config.REMINDERS.some(function (r) { return r.id === raw.reminder; }) ? raw.reminder : 'none';

    var start = Dates.isValidTimeString(raw.start) ? raw.start : '';
    var end = Dates.isValidTimeString(raw.end) ? raw.end : '';

    var allDay = raw.allDay === true || (raw.allDay === undefined && !start);
    if (allDay) { start = ''; end = ''; }
    else if (!start) { allDay = true; } // pas d'heure => journée entière, par cohérence

    // Une fin qui n'est pas strictement après le début est incohérente :
    // on répare en l'effaçant plutôt que de rejeter tout l'événement.
    if (end && start && Dates.timeToMinutes(end) <= Dates.timeToMinutes(start)) {
      end = '';
    }

    var id = (typeof raw.id === 'string' && raw.id) ? raw.id : uid('evt');
    var now = new Date().toISOString();

    return {
      id: id,
      title: title,
      type: typeId,
      date: raw.date,
      allDay: allDay,
      start: start,
      end: end,
      color: color,
      place: typeof raw.place === 'string' ? raw.place.slice(0, 120) : '',
      who: who,
      reminder: reminder,
      notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 4000) : '',
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now
    };
  }

  function sanitizeStoredSticker(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (!Dates.isValidDateKey(raw.date)) return null;
    if (typeof raw.emoji !== 'string' || !raw.emoji) return null;
    return {
      id: (typeof raw.id === 'string' && raw.id) ? raw.id : uid('stk'),
      date: raw.date,
      emoji: raw.emoji.slice(0, 8)
    };
  }

  /* ---------- Normalisation défensive de l'ensemble des données ---------- */
  function normalize(data) {
    var base = defaultData();
    if (!data || typeof data !== 'object') return base;
    var out = migrate(data);
    if (!out.settings || typeof out.settings !== 'object') out.settings = base.settings;
    Object.keys(base.settings).forEach(function (k) {
      if (out.settings[k] === undefined || out.settings[k] === null) {
        out.settings[k] = base.settings[k];
      }
    });
    if (!Config.THEMES.some(function (t) { return t.id === out.settings.theme; })) {
      out.settings.theme = base.settings.theme;
    }

    var rawEvents = Array.isArray(out.events) ? out.events : [];
    out.events = rawEvents.map(sanitizeStoredEvent).filter(Boolean);

    var rawStickers = Array.isArray(out.stickers) ? out.stickers : [];
    out.stickers = rawStickers.map(sanitizeStoredSticker).filter(Boolean);

    out.version = SCHEMA_VERSION;
    return out;
  }

  /* ---------- Validation stricte d'une saisie utilisateur ----------
     Contrairement à sanitizeStoredEvent (tolérante, pour les données déjà
     en base), celle-ci ne répare rien silencieusement : elle rend la main
     avec des erreurs précises pour que le formulaire les affiche. */
  function validateEventDraft(payload) {
    var errors = [];
    var title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) errors.push({ field: 'title', message: 'Le titre est obligatoire.' });

    if (!Dates.isValidDateKey(payload.date)) {
      errors.push({ field: 'date', message: 'La date est invalide.' });
    }

    var allDay = !!payload.allDay;
    var start = payload.start || '';
    var end = payload.end || '';

    if (!allDay) {
      if (!Dates.isValidTimeString(start)) {
        errors.push({ field: 'start', message: 'Indiquez une heure de début, ou cochez « Journée entière ».' });
      }
      if (end && !Dates.isValidTimeString(end)) {
        errors.push({ field: 'end', message: "L'heure de fin est invalide." });
      }
      if (Dates.isValidTimeString(start) && end && Dates.isValidTimeString(end)) {
        if (Dates.timeToMinutes(end) <= Dates.timeToMinutes(start)) {
          errors.push({ field: 'end', message: "L'heure de fin doit être après l'heure de début." });
        }
      }
    }

    if (errors.length) return { ok: false, errors: errors };

    return {
      ok: true,
      value: {
        id: payload.id,
        title: title,
        type: Config.EVENT_TYPES.some(function (t) { return t.id === payload.type; }) ? payload.type : 'date',
        date: payload.date,
        allDay: allDay,
        start: allDay ? '' : start,
        end: allDay ? '' : end,
        color: payload.color || Config.typeById(payload.type).color,
        place: typeof payload.place === 'string' ? payload.place.trim().slice(0, 120) : '',
        who: Config.WHO.some(function (w) { return w.id === payload.who; }) ? payload.who : 'both',
        reminder: Config.REMINDERS.some(function (r) { return r.id === payload.reminder; }) ? payload.reminder : 'none',
        notes: typeof payload.notes === 'string' ? payload.notes.slice(0, 4000) : ''
      }
    };
  }

  /* ---------- Lecture / écriture ---------- */
  var state = null;
  var listeners = [];

  function readRaw(key) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('[storage] lecture impossible sur ' + key, err);
      return null;
    }
  }

  function load() {
    if (state) return state;
    var data = readRaw(STORAGE_KEY);
    if (!data) {
      // Filet de sécurité : on tente la copie de secours
      data = readRaw(BACKUP_KEY);
      if (data) console.warn('[storage] restauration depuis la sauvegarde de secours');
    }
    var wasVersion = data && data.version;
    state = normalize(data);
    // Si la sauvegarde venait d'une version antérieure, on réécrit tout de
    // suite au nouveau format : la donnée migrée ne dépend plus d'une
    // future action de l'utilisateur pour être conservée.
    if (data && wasVersion !== SCHEMA_VERSION) writeToDisk();
    return state;
  }

  /** Écrit `state` sur le disque. Ne modifie jamais `state` lui-même :
      c'est aux appelants (via mutate()) de décider quoi faire en cas d'échec. */
  function writeToDisk() {
    var json;
    try {
      json = JSON.stringify(state);
    } catch (err) {
      return { ok: false, code: 'serialize', message: 'Données impossibles à sérialiser.' };
    }
    try {
      var previous = global.localStorage.getItem(STORAGE_KEY);
      if (previous) global.localStorage.setItem(BACKUP_KEY, previous);
    } catch (err) {
      // La copie de secours est un confort, pas un blocant : on continue.
      console.warn('[storage] copie de secours impossible', err);
    }
    try {
      global.localStorage.setItem(STORAGE_KEY, json);
      return { ok: true };
    } catch (err) {
      var isQuota = err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
      console.error('[storage] écriture impossible', err);
      return {
        ok: false,
        code: isQuota ? 'quota' : 'write',
        message: isQuota
          ? 'Stockage plein sur cet appareil : impossible d\'enregistrer. Exportez vos données puis libérez de la place.'
          : 'Impossible d\'enregistrer sur cet appareil.'
      };
    }
  }

  function emit() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (err) { console.error(err); }
    });
  }

  function subscribe(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (l) { return l !== fn; });
    };
  }

  /** Applique une mutation sur `state`, persiste, et annule proprement
      (rollback mémoire) si l'écriture disque échoue réellement — l'UI
      n'affichera donc jamais un succès qui n'a pas eu lieu. */
  function mutate(mutator) {
    load();
    var snapshot;
    try {
      snapshot = JSON.parse(JSON.stringify(state));
    } catch (err) {
      snapshot = null;
    }
    var value;
    try {
      value = mutator();
    } catch (err) {
      console.error('[storage] mutation invalide', err);
      return { ok: false, code: 'mutation', message: 'Modification invalide.' };
    }
    var result = writeToDisk();
    if (!result.ok) {
      if (snapshot) state = snapshot; // rollback : la mémoire reflète le disque réel
      return { ok: false, code: result.code, message: result.message };
    }
    emit();
    return { ok: true, value: value };
  }

  /* ---------- Identifiants ---------- */
  function uid(prefix) {
    return (prefix || 'id') + '-' +
      Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 8);
  }

  /* ---------- API Événements ---------- */
  function getEvents() { return load().events.slice(); }

  function getEventsByDate(dateStr) {
    return load().events
      .filter(function (e) { return e.date === dateStr; })
      .sort(function (a, b) {
        return (a.start || '99:99').localeCompare(b.start || '99:99');
      });
  }

  function getEvent(id) {
    var found = load().events.filter(function (e) { return e.id === id; });
    return found.length ? found[0] : null;
  }

  /** Valide puis enregistre. Retour : { ok, value: id } ou { ok:false, code, message, errors? } */
  function saveEvent(payload) {
    load();
    var isEdit = !!(payload && payload.id && getEvent(payload.id));
    var validation = validateEventDraft(payload || {});
    if (!validation.ok) {
      return {
        ok: false,
        code: 'validation',
        message: validation.errors[0] ? validation.errors[0].message : 'Données invalides.',
        errors: validation.errors
      };
    }
    var clean = validation.value;

    return mutate(function () {
      var now = new Date().toISOString();
      if (isEdit) {
        state.events = state.events.map(function (e) {
          return e.id === clean.id ? Object.assign({}, e, clean, { updatedAt: now }) : e;
        });
        return clean.id;
      }
      var id = uid('evt');
      state.events.push(Object.assign({}, clean, { id: id, createdAt: now, updatedAt: now }));
      return id;
    });
  }

  function deleteEvent(id) {
    return mutate(function () {
      state.events = state.events.filter(function (e) { return e.id !== id; });
      return id;
    });
  }

  /* ---------- API Stickers (décoration de l'agenda) ---------- */
  function getStickers() { return load().stickers.slice(); }

  function getStickersByDate(dateStr) {
    return load().stickers.filter(function (s) { return s.date === dateStr; });
  }

  function addSticker(dateStr, emoji) {
    if (!Dates.isValidDateKey(dateStr) || !emoji) {
      return { ok: false, code: 'validation', message: 'Autocollant invalide.' };
    }
    return mutate(function () {
      var id = uid('stk');
      state.stickers.push({ id: id, date: dateStr, emoji: emoji });
      return id;
    });
  }

  function removeSticker(id) {
    return mutate(function () {
      state.stickers = state.stickers.filter(function (s) { return s.id !== id; });
      return id;
    });
  }

  function clearStickers(dateStr) {
    return mutate(function () {
      state.stickers = state.stickers.filter(function (s) { return s.date !== dateStr; });
      return true;
    });
  }

  /* ---------- API Réglages ---------- */
  function getSettings() { return Object.assign({}, load().settings); }

  function setSetting(key, value) {
    return mutate(function () {
      state.settings[key] = value;
      return value;
    });
  }

  /* ---------- Export / Import ---------- */
  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  /** Valide la structure grossière d'un import avant d'aller plus loin. */
  function looksLikeValidBackup(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (parsed.events !== undefined && !Array.isArray(parsed.events)) return false;
    if (parsed.stickers !== undefined && !Array.isArray(parsed.stickers)) return false;
    if (parsed.settings !== undefined && typeof parsed.settings !== 'object') return false;
    return true;
  }

  /** Importe une sauvegarde JSON. Remplace les données actuelles :
      une copie de secours de l'état précédent est conservée sous une clé
      dédiée avant tout remplacement, pour permettre une récupération. */
  function importJSON(json) {
    var parsed;
    try {
      parsed = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (err) {
      return { ok: false, code: 'parse', message: 'Ce fichier n\'est pas un JSON valide.' };
    }
    if (!looksLikeValidBackup(parsed)) {
      return { ok: false, code: 'structure', message: 'Ce fichier ne ressemble pas à une sauvegarde Nous Deux.' };
    }

    load();
    try {
      global.localStorage.setItem(PRE_IMPORT_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('[storage] copie pré-import impossible', err);
    }

    var incoming = normalize(parsed);
    return mutate(function () {
      state = incoming;
      return true;
    });
  }

  function resetAll() {
    return mutate(function () {
      state = defaultData();
      return true;
    });
  }

  global.Storage = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    load: load,
    subscribe: subscribe,
    uid: uid,
    getEvents: getEvents,
    getEventsByDate: getEventsByDate,
    getEvent: getEvent,
    saveEvent: saveEvent,
    deleteEvent: deleteEvent,
    validateEventDraft: validateEventDraft,
    getStickers: getStickers,
    getStickersByDate: getStickersByDate,
    addSticker: addSticker,
    removeSticker: removeSticker,
    clearStickers: clearStickers,
    getSettings: getSettings,
    setSetting: setSetting,
    exportJSON: exportJSON,
    importJSON: importJSON,
    resetAll: resetAll
  };
})(window);
