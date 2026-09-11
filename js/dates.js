/* ============================================================
   Dates — utilitaires calendrier (semaine commençant le lundi)
   ============================================================ */
(function (global) {
  'use strict';

  var MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  var JOURS_COURT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /** Date -> 'YYYY-MM-DD' (en heure locale, jamais UTC) */
  function toKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  /** 'YYYY-MM-DD' -> Date (midi local, pour éviter les décalages) */
  function fromKey(key) {
    var p = String(key).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0);
  }

  function today() { return new Date(); }
  function todayKey() { return toKey(new Date()); }

  function addDays(date, n) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
  }

  function addMonths(date, n) {
    var d = new Date(date.getFullYear(), date.getMonth() + n, 1, 12);
    var day = Math.min(date.getDate(), daysInMonth(d.getFullYear(), d.getMonth()));
    d.setDate(day);
    return d;
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /** Index 0 = lundi ... 6 = dimanche */
  function weekdayIndex(date) {
    return (date.getDay() + 6) % 7;
  }

  function startOfWeek(date) {
    return addDays(date, -weekdayIndex(date));
  }

  function weekDays(date) {
    var start = startOfWeek(date);
    var out = [];
    for (var i = 0; i < 7; i++) out.push(addDays(start, i));
    return out;
  }

  /** Grille du mois : 6 lignes x 7 jours, débordements inclus */
  function monthGrid(year, month) {
    var first = new Date(year, month, 1, 12);
    var start = startOfWeek(first);
    var cells = [];
    for (var i = 0; i < 42; i++) {
      var d = addDays(start, i);
      cells.push({
        date: d,
        key: toKey(d),
        inMonth: d.getMonth() === month,
        isToday: toKey(d) === todayKey()
      });
    }
    return cells;
  }

  function sameDay(a, b) { return toKey(a) === toKey(b); }

  /* ---------- Formats d'affichage ---------- */
  function monthLabel(date) {
    return MOIS[date.getMonth()] + ' ' + date.getFullYear();
  }

  function dayLabel(date) {
    return JOURS[weekdayIndex(date)] + ' ' + date.getDate() + ' ' + MOIS[date.getMonth()].toLowerCase();
  }

  function dayLabelLong(date) {
    return JOURS[weekdayIndex(date)] + ' ' + date.getDate() + ' ' +
      MOIS[date.getMonth()].toLowerCase() + ' ' + date.getFullYear();
  }

  function weekLabel(date) {
    var days = weekDays(date);
    var a = days[0], b = days[6];
    if (a.getMonth() === b.getMonth()) {
      return a.getDate() + ' – ' + b.getDate() + ' ' + MOIS[a.getMonth()].toLowerCase() + ' ' + a.getFullYear();
    }
    return a.getDate() + ' ' + MOIS[a.getMonth()].toLowerCase().slice(0, 4) + '. – ' +
      b.getDate() + ' ' + MOIS[b.getMonth()].toLowerCase().slice(0, 4) + '. ' + b.getFullYear();
  }

  /** Nombre de jours entiers entre aujourd'hui et une date clé */
  function daysUntil(key) {
    var now = fromKey(todayKey());
    var target = fromKey(key);
    return Math.round((target - now) / 86400000);
  }

  function countdownLabel(key) {
    var n = daysUntil(key);
    if (n === 0) return "Aujourd'hui";
    if (n === 1) return 'Demain';
    if (n === -1) return 'Hier';
    if (n > 1) return 'Dans ' + n + ' jours';
    return 'Il y a ' + Math.abs(n) + ' jours';
  }

  /** 'HH:MM' -> minutes depuis minuit (null si vide ou invalide) */
  function timeToMinutes(t) {
    if (!isValidTimeString(t)) return null;
    var p = String(t).split(':');
    return (+p[0]) * 60 + (+p[1]);
  }

  /** Une date au format strict 'YYYY-MM-DD', calendaire réellement valide */
  function isValidDateKey(key) {
    if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    var p = key.split('-');
    var y = +p[0], m = +p[1], d = +p[2];
    if (m < 1 || m > 12) return false;
    return d >= 1 && d <= daysInMonth(y, m - 1);
  }

  /** Une heure au format strict 'HH:MM' (00:00 à 23:59) */
  function isValidTimeString(t) {
    return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  }

  global.Dates = {
    MOIS: MOIS, JOURS: JOURS, JOURS_COURT: JOURS_COURT,
    pad: pad, toKey: toKey, fromKey: fromKey,
    today: today, todayKey: todayKey,
    addDays: addDays, addMonths: addMonths, daysInMonth: daysInMonth,
    weekdayIndex: weekdayIndex, startOfWeek: startOfWeek, weekDays: weekDays,
    monthGrid: monthGrid, sameDay: sameDay,
    monthLabel: monthLabel, dayLabel: dayLabel, dayLabelLong: dayLabelLong,
    weekLabel: weekLabel,
    daysUntil: daysUntil, countdownLabel: countdownLabel,
    timeToMinutes: timeToMinutes,
    isValidDateKey: isValidDateKey,
    isValidTimeString: isValidTimeString
  };
})(window);
