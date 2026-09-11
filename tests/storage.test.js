'use strict';
const { createSandbox, suite, test, assert, assertEqual, summary } = require('./harness');

suite('Storage — création, édition, suppression d\'événements', function () {
  var sandbox = createSandbox();
  var Storage = sandbox.Storage;

  test('saveEvent crée un événement valide et le relit', function () {
    var result = Storage.saveEvent({
      title: 'Resto', type: 'date', date: '2026-05-01',
      allDay: false, start: '20:00', end: '22:00',
      color: '#ef6f8e', place: 'Chez Luigi', who: 'both', reminder: 'none', notes: ''
    });
    assert(result.ok, 'la sauvegarde doit réussir');
    var evt = Storage.getEvent(result.value);
    assert(evt, 'l\'événement doit être relisible');
    assertEqual(evt.title, 'Resto');
    assertEqual(evt.start, '20:00');
  });

  test('saveEvent refuse un titre vide', function () {
    var result = Storage.saveEvent({ title: '  ', date: '2026-05-01', allDay: true });
    assertEqual(result.ok, false);
    assertEqual(result.code, 'validation');
  });

  test('saveEvent refuse une date invalide', function () {
    var result = Storage.saveEvent({ title: 'X', date: '2026-13-40', allDay: true });
    assertEqual(result.ok, false);
    assertEqual(result.code, 'validation');
  });

  test('saveEvent refuse une heure de fin antérieure ou égale au début', function () {
    var r1 = Storage.saveEvent({ title: 'X', date: '2026-05-01', allDay: false, start: '20:00', end: '19:00' });
    assertEqual(r1.ok, false);
    var r2 = Storage.saveEvent({ title: 'X', date: '2026-05-01', allDay: false, start: '20:00', end: '20:00' });
    assertEqual(r2.ok, false);
  });

  test('saveEvent accepte un événement journée entière sans heure', function () {
    var result = Storage.saveEvent({ title: 'Anniversaire', date: '2026-06-01', allDay: true, type: 'anniversaire' });
    assert(result.ok);
    var evt = Storage.getEvent(result.value);
    assertEqual(evt.allDay, true);
    assertEqual(evt.start, '');
  });

  test('saveEvent accepte une heure de début seule, sans fin', function () {
    var result = Storage.saveEvent({ title: 'Sortie', date: '2026-06-02', allDay: false, start: '09:00', end: '' });
    assert(result.ok);
    var evt = Storage.getEvent(result.value);
    assertEqual(evt.start, '09:00');
    assertEqual(evt.end, '');
  });

  test('saveEvent en édition conserve l\'id et remplace les champs', function () {
    var created = Storage.saveEvent({ title: 'V1', date: '2026-05-01', allDay: true });
    var edited = Storage.saveEvent({ id: created.value, title: 'V2', date: '2026-05-02', allDay: true });
    assert(edited.ok);
    assertEqual(edited.value, created.value);
    var evt = Storage.getEvent(created.value);
    assertEqual(evt.title, 'V2');
    assertEqual(evt.date, '2026-05-02');
  });

  test('deleteEvent retire bien l\'événement', function () {
    var created = Storage.saveEvent({ title: 'À supprimer', date: '2026-05-03', allDay: true });
    var result = Storage.deleteEvent(created.value);
    assert(result.ok);
    assertEqual(Storage.getEvent(created.value), null);
  });

  test('getEventsByDate trie par heure de début', function () {
    Storage.saveEvent({ title: 'Tard', date: '2026-07-01', allDay: false, start: '20:00' });
    Storage.saveEvent({ title: 'Tôt', date: '2026-07-01', allDay: false, start: '08:00' });
    var list = Storage.getEventsByDate('2026-07-01');
    assertEqual(list[0].title, 'Tôt');
    assertEqual(list[1].title, 'Tard');
  });
});

suite('Storage — migrations et réparation défensive', function () {
  test('une sauvegarde v0 (sans version) est migrée vers le schéma courant', function () {
    var sandbox = createSandbox();
    sandbox.localStorage.setItem('nousdeux.data', JSON.stringify({
      events: [{ id: 'old-1', title: 'Vieux', type: 'date', date: '2026-01-01' }]
    }));
    var state = sandbox.Storage.load();
    assertEqual(state.version, sandbox.Storage.SCHEMA_VERSION);
    assertEqual(state.events.length, 1);
    assertEqual(state.events[0].allDay, true); // pas de start -> journée entière déduite
  });

  test('une sauvegarde v1 sans champ allDay est migrée en v2 avec allDay déduit', function () {
    var sandbox = createSandbox();
    sandbox.localStorage.setItem('nousdeux.data', JSON.stringify({
      version: 1,
      settings: { theme: 'love', partnerA: 'A', partnerB: 'B', lastView: 'month' },
      events: [
        { id: 'e1', title: 'Avec heure', type: 'date', date: '2026-01-01', start: '10:00', end: '', color: '#ef6f8e', place: '', who: 'both', reminder: 'none', notes: '' },
        { id: 'e2', title: 'Sans heure', type: 'date', date: '2026-01-02', start: '', end: '', color: '#ef6f8e', place: '', who: 'both', reminder: 'none', notes: '' }
      ],
      stickers: []
    }));
    var state = sandbox.Storage.load();
    var e1 = state.events.filter(function (e) { return e.id === 'e1'; })[0];
    var e2 = state.events.filter(function (e) { return e.id === 'e2'; })[0];
    assertEqual(e1.allDay, false);
    assertEqual(e2.allDay, true);
  });

  test('un événement sans id ni date manquante est réparé (id régénéré)', function () {
    var sandbox = createSandbox();
    sandbox.localStorage.setItem('nousdeux.data', JSON.stringify({
      version: 2,
      events: [{ title: 'Sans id', type: 'date', date: '2026-01-01', allDay: true }]
    }));
    var state = sandbox.Storage.load();
    assertEqual(state.events.length, 1);
    assert(state.events[0].id, 'un id doit avoir été généré');
  });

  test('un événement avec une date invalide est rejeté (irréparable), les autres sont conservés', function () {
    var sandbox = createSandbox();
    sandbox.localStorage.setItem('nousdeux.data', JSON.stringify({
      version: 2,
      events: [
        { id: 'bad', title: 'Casse', type: 'date', date: 'not-a-date', allDay: true },
        { id: 'good', title: 'OK', type: 'date', date: '2026-01-01', allDay: true }
      ]
    }));
    var state = sandbox.Storage.load();
    assertEqual(state.events.length, 1);
    assertEqual(state.events[0].id, 'good');
  });

  test('une fin incohérente (<= début) est réparée en vidant la fin, pas en rejetant l\'événement', function () {
    var sandbox = createSandbox();
    sandbox.localStorage.setItem('nousdeux.data', JSON.stringify({
      version: 2,
      events: [{ id: 'e1', title: 'X', type: 'date', date: '2026-01-01', allDay: false, start: '20:00', end: '19:00' }]
    }));
    var state = sandbox.Storage.load();
    assertEqual(state.events.length, 1);
    assertEqual(state.events[0].end, '');
    assertEqual(state.events[0].start, '20:00');
  });

  test('un thème invalide en base retombe sur le thème par défaut', function () {
    var sandbox = createSandbox();
    sandbox.localStorage.setItem('nousdeux.data', JSON.stringify({
      version: 2, settings: { theme: 'inexistant' }, events: [], stickers: []
    }));
    var state = sandbox.Storage.load();
    assertEqual(state.settings.theme, 'love');
  });

  test('des données totalement corrompues (non-objet) redonnent un état par défaut utilisable', function () {
    var sandbox = createSandbox();
    sandbox.localStorage.setItem('nousdeux.data', '"juste une chaîne"');
    var state = sandbox.Storage.load();
    assertEqual(Array.isArray(state.events), true);
    assertEqual(state.events.length, 0);
  });
});

suite('Storage — panne d\'écriture (quota) : jamais de faux succès', function () {
  test('saveEvent renvoie ok:false si localStorage.setItem échoue, sans corrompre l\'état mémoire', function () {
    var sandbox = createSandbox();
    var Storage = sandbox.Storage;
    // Un premier événement est enregistré avec succès.
    var first = Storage.saveEvent({ title: 'Avant panne', date: '2026-01-01', allDay: true });
    assert(first.ok);

    // On simule un stockage plein.
    sandbox.localStorage.setItem = function () {
      var err = new Error('quota');
      err.name = 'QuotaExceededError';
      throw err;
    };

    var second = Storage.saveEvent({ title: 'Pendant la panne', date: '2026-01-02', allDay: true });
    assertEqual(second.ok, false);
    assertEqual(second.code, 'quota');

    // L'état en mémoire ne doit pas contenir l'événement raté (rollback).
    var all = Storage.getEvents();
    assertEqual(all.length, 1);
    assertEqual(all[0].title, 'Avant panne');
  });
});

suite('Storage — import / export', function () {
  test('exportJSON puis importJSON restitue les mêmes événements', function () {
    var sandboxA = createSandbox();
    sandboxA.Storage.saveEvent({ title: 'À exporter', date: '2026-08-01', allDay: true });
    var json = sandboxA.Storage.exportJSON();

    var sandboxB = createSandbox();
    var result = sandboxB.Storage.importJSON(json);
    assert(result.ok);
    var events = sandboxB.Storage.getEvents();
    assertEqual(events.length, 1);
    assertEqual(events[0].title, 'À exporter');
  });

  test('importJSON rejette un JSON syntaxiquement invalide', function () {
    var sandbox = createSandbox();
    var result = sandbox.Storage.importJSON('{ ceci n\'est pas du json');
    assertEqual(result.ok, false);
    assertEqual(result.code, 'parse');
  });

  test('importJSON rejette une structure qui ne ressemble pas à une sauvegarde', function () {
    var sandbox = createSandbox();
    var result = sandbox.Storage.importJSON(JSON.stringify({ events: 'pas un tableau' }));
    assertEqual(result.ok, false);
    assertEqual(result.code, 'structure');
  });

  test('importJSON conserve une copie de secours des données précédentes', function () {
    var sandbox = createSandbox();
    sandbox.Storage.saveEvent({ title: 'Ancien', date: '2026-01-01', allDay: true });
    sandbox.Storage.importJSON(JSON.stringify({ events: [], stickers: [], settings: {} }));
    var preImport = sandbox.localStorage.getItem('nousdeux.data.pre-import');
    assert(preImport, 'une copie pré-import doit exister');
    assert(preImport.indexOf('Ancien') >= 0, 'la copie doit contenir l\'ancien événement');
  });

  test('resetAll vide bien les événements et autocollants', function () {
    var sandbox = createSandbox();
    sandbox.Storage.saveEvent({ title: 'X', date: '2026-01-01', allDay: true });
    sandbox.Storage.addSticker('2026-01-01', '❤️');
    var result = sandbox.Storage.resetAll();
    assert(result.ok);
    assertEqual(sandbox.Storage.getEvents().length, 0);
    assertEqual(sandbox.Storage.getStickers().length, 0);
  });
});

suite('Storage — autocollants', function () {
  test('addSticker puis removeSticker', function () {
    var sandbox = createSandbox();
    var add = sandbox.Storage.addSticker('2026-01-01', '⭐');
    assert(add.ok);
    assertEqual(sandbox.Storage.getStickersByDate('2026-01-01').length, 1);
    var remove = sandbox.Storage.removeSticker(add.value);
    assert(remove.ok);
    assertEqual(sandbox.Storage.getStickersByDate('2026-01-01').length, 0);
  });

  test('addSticker refuse une date invalide', function () {
    var sandbox = createSandbox();
    var result = sandbox.Storage.addSticker('pas-une-date', '⭐');
    assertEqual(result.ok, false);
  });
});

summary();
