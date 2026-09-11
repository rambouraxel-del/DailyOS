'use strict';
const { createSandbox, suite, test, assert, assertEqual, summary } = require('./harness');
const sandbox = createSandbox();
const Dates = sandbox.Dates;

suite('Dates — clés et validité', function () {
  test('toKey / fromKey sont réciproques', function () {
    var d = new Date(2026, 2, 5, 12, 0, 0);
    assertEqual(Dates.toKey(d), '2026-03-05');
    var back = Dates.fromKey('2026-03-05');
    assertEqual(back.getFullYear(), 2026);
    assertEqual(back.getMonth(), 2);
    assertEqual(back.getDate(), 5);
  });

  test('isValidDateKey rejette les dates calendaires impossibles', function () {
    assert(Dates.isValidDateKey('2026-02-28'), '28 février doit être valide');
    assert(!Dates.isValidDateKey('2026-02-30'), '30 février doit être invalide');
    assert(!Dates.isValidDateKey('2026-13-01'), 'mois 13 doit être invalide');
    assert(!Dates.isValidDateKey('2026-1-1'), 'format non paddé doit être invalide');
    assert(!Dates.isValidDateKey(''), 'chaîne vide invalide');
    assert(!Dates.isValidDateKey(null), 'null invalide');
  });

  test('isValidDateKey accepte les années bissextiles', function () {
    assert(Dates.isValidDateKey('2024-02-29'), '2024 est bissextile');
    assert(!Dates.isValidDateKey('2023-02-29'), '2023 ne l\'est pas');
  });

  test('isValidTimeString valide le format HH:MM strict', function () {
    assert(Dates.isValidTimeString('09:30'));
    assert(Dates.isValidTimeString('23:59'));
    assert(!Dates.isValidTimeString('24:00'));
    assert(!Dates.isValidTimeString('9:30'));
    assert(!Dates.isValidTimeString('09:60'));
    assert(!Dates.isValidTimeString(''));
    assert(!Dates.isValidTimeString(undefined));
  });

  test('timeToMinutes calcule correctement et rejette les entrées invalides', function () {
    assertEqual(Dates.timeToMinutes('00:00'), 0);
    assertEqual(Dates.timeToMinutes('01:30'), 90);
    assertEqual(Dates.timeToMinutes('23:59'), 1439);
    assertEqual(Dates.timeToMinutes(''), null);
    assertEqual(Dates.timeToMinutes('bad'), null);
  });
});

suite('Dates — semaine et mois', function () {
  test('weekdayIndex : lundi = 0, dimanche = 6', function () {
    // 2026-03-02 est un lundi
    var monday = Dates.fromKey('2026-03-02');
    assertEqual(Dates.weekdayIndex(monday), 0);
    var sunday = Dates.fromKey('2026-03-08');
    assertEqual(Dates.weekdayIndex(sunday), 6);
  });

  test('monthGrid retourne toujours 42 cellules', function () {
    var grid = Dates.monthGrid(2026, 1); // février 2026
    assertEqual(grid.length, 42);
  });

  test('addMonths gère les fins de mois (31 janvier -> 28/29 février)', function () {
    var jan31 = new Date(2026, 0, 31, 12);
    var feb = Dates.addMonths(jan31, 1);
    assertEqual(feb.getMonth(), 1);
    assertEqual(feb.getDate(), 28); // 2026 n'est pas bissextile
  });
});

summary();
