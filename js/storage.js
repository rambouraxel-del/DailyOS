/* ============================================================
   Storage — mémoire interne versionnée
   Objectif : aucune donnée ne doit se perdre entre les sessions
   ni entre les mises à jour de l'application.
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'nousdeux.data';
  var BACKUP_KEY = 'nousdeux.data.backup';
  var SCHEMA_VERSION = 1;

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

  /* ---------- Normalisation défensive ---------- */
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
    if (!Array.isArray(out.events)) out.events = [];
    if (!Array.isArray(out.stickers)) out.stickers = [];
    out.events = out.events.filter(function (e) { return e && e.id && e.date; });
    out.stickers = out.stickers.filter(function (s) { return s && s.id && s.date; });
    out.version = SCHEMA_VERSION;
    return out;
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
    if (data && wasVersion !== SCHEMA_VERSION) persist();
    return state;
  }

  function persist() {
    try {
      var json = JSON.stringify(state);
      // La copie de secours est écrite AVANT, avec l'ancienne valeur saine.
      var previous = global.localStorage.getItem(STORAGE_KEY);
      if (previous) global.localStorage.setItem(BACKUP_KEY, previous);
      global.localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch (err) {
      console.error('[storage] écriture impossible', err);
      return false;
    }
  }

  function emit() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (err) { console.error(err); }
    });
  }

  function commit() {
    persist();
    emit();
  }

  function subscribe(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (l) { return l !== fn; });
    };
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

  function saveEvent(evt) {
    load();
    var now = new Date().toISOString();
    if (evt.id) {
      state.events = state.events.map(function (e) {
        return e.id === evt.id
          ? Object.assign({}, e, evt, { updatedAt: now })
          : e;
      });
    } else {
      evt.id = uid('evt');
      evt.createdAt = now;
      evt.updatedAt = now;
      state.events.push(evt);
    }
    commit();
    return evt.id;
  }

  function deleteEvent(id) {
    load();
    state.events = state.events.filter(function (e) { return e.id !== id; });
    commit();
  }

  /* ---------- API Stickers (décoration de l'agenda) ---------- */
  function getStickers() { return load().stickers.slice(); }

  function getStickersByDate(dateStr) {
    return load().stickers.filter(function (s) { return s.date === dateStr; });
  }

  function addSticker(dateStr, emoji) {
    load();
    state.stickers.push({ id: uid('stk'), date: dateStr, emoji: emoji });
    commit();
  }

  function removeSticker(id) {
    load();
    state.stickers = state.stickers.filter(function (s) { return s.id !== id; });
    commit();
  }

  function clearStickers(dateStr) {
    load();
    state.stickers = state.stickers.filter(function (s) { return s.date !== dateStr; });
    commit();
  }

  /* ---------- API Réglages ---------- */
  function getSettings() { return Object.assign({}, load().settings); }

  function setSetting(key, value) {
    load();
    state.settings[key] = value;
    commit();
  }

  /* ---------- Export / Import ---------- */
  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  function importJSON(json) {
    var parsed = typeof json === 'string' ? JSON.parse(json) : json;
    state = normalize(parsed);
    commit();
    return state;
  }

  function resetAll() {
    state = defaultData();
    commit();
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
