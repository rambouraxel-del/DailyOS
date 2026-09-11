/* ============================================================
   Vue Agenda — mensuelle / hebdomadaire / journalière
   ============================================================ */
(function (global) {
  'use strict';

  var el = UI.el;
  var cursor = new Date();       // date de référence affichée
  var mode = 'month';            // 'month' | 'week' | 'day'
  var root = null;

  var HOUR_HEIGHT = 52;          // px, doit correspondre au CSS

  /* Fenêtre horaire adaptée aux événements du jour : inutile d'afficher
     huit heures vides au-dessus d'une soirée qui commence à 20h. */
  function hourRange(events) {
    if (!events.length) return { start: 8, end: 22 };
    var min = 24, max = 0;
    events.forEach(function (e) {
      var s = Math.floor(Dates.timeToMinutes(e.start) / 60);
      var endMin = Dates.timeToMinutes(e.end) || (Dates.timeToMinutes(e.start) + 60);
      var en = Math.ceil(endMin / 60);
      if (s < min) min = s;
      if (en > max) max = en;
    });
    return {
      start: Math.max(0, min - 1),
      end: Math.min(24, Math.max(max + 1, min + 4))
    };
  }

  /* ---------- Petits blocs réutilisables ---------- */

  function eventPill(evt, opts) {
    opts = opts || {};
    var type = Config.typeById(evt.type);
    return el('button', {
      class: 'evt-pill' + (opts.compact ? ' is-compact' : ''),
      style: '--evt:' + (evt.color || type.color),
      type: 'button',
      onclick: function (e) {
        e.stopPropagation();
        EventForm.open({ eventId: evt.id, onSaved: render });
      }
    }, [
      el('span', { class: 'evt-emoji', text: type.emoji }),
      el('span', { class: 'evt-text' }, [
        el('span', { class: 'evt-title', text: evt.title }),
        evt.start && !opts.compact
          ? el('span', { class: 'evt-meta', text: evt.start + (evt.end ? ' – ' + evt.end : '') + (evt.place ? ' · ' + evt.place : '') })
          : null
      ])
    ]);
  }

  function emptyState(text, dateKey) {
    return el('div', { class: 'empty' }, [
      el('div', { class: 'empty-emoji', text: '🗓️' }),
      el('p', { class: 'muted', text: text }),
      el('button', {
        class: 'btn btn-soft', type: 'button', text: '+ Ajouter un événement',
        onclick: function () { EventForm.open({ date: dateKey, onSaved: render }); }
      })
    ]);
  }

  /* ---------- Vue mensuelle ---------- */

  function renderMonth() {
    var grid = Dates.monthGrid(cursor.getFullYear(), cursor.getMonth());
    var wrap = el('div', { class: 'month' });

    var head = el('div', { class: 'month-head' });
    Dates.JOURS_COURT.forEach(function (d, i) {
      head.appendChild(el('span', { class: 'month-head-cell' + (i >= 5 ? ' is-weekend' : ''), text: d }));
    });
    wrap.appendChild(head);

    var body = el('div', { class: 'month-grid' });
    grid.forEach(function (cell) {
      var events = Storage.getEventsByDate(cell.key);
      var stickers = Storage.getStickersByDate(cell.key);

      var dots = el('div', { class: 'day-dots' });
      events.slice(0, 4).forEach(function (evt) {
        dots.appendChild(el('span', {
          class: 'dot',
          style: '--evt:' + (evt.color || Config.typeById(evt.type).color)
        }));
      });

      var stickerRow = el('div', { class: 'day-stickers' });
      stickers.slice(0, 3).forEach(function (s) {
        stickerRow.appendChild(el('span', { class: 'day-sticker', text: s.emoji }));
      });

      body.appendChild(el('button', {
        class: 'day-cell' +
          (cell.inMonth ? '' : ' is-out') +
          (cell.isToday ? ' is-today' : '') +
          (events.length ? ' has-events' : ''),
        type: 'button',
        onclick: function () { cursor = cell.date; mode = 'day'; render(); }
      }, [
        el('span', { class: 'day-num', text: String(cell.date.getDate()) }),
        stickerRow,
        dots,
        events.length > 4 ? el('span', { class: 'day-more', text: '+' + (events.length - 4) }) : null
      ]));
    });
    wrap.appendChild(body);
    return wrap;
  }

  /* ---------- Vue hebdomadaire ---------- */

  function renderWeek() {
    var days = Dates.weekDays(cursor);
    var wrap = el('div', { class: 'week' });

    days.forEach(function (d) {
      var key = Dates.toKey(d);
      var events = Storage.getEventsByDate(key);
      var stickers = Storage.getStickersByDate(key);
      var isToday = key === Dates.todayKey();

      var list = el('div', { class: 'week-events' });
      if (events.length) {
        events.forEach(function (evt) { list.appendChild(eventPill(evt)); });
      } else {
        list.appendChild(el('span', { class: 'muted small', text: 'Rien de prévu' }));
      }

      wrap.appendChild(el('section', { class: 'week-day' + (isToday ? ' is-today' : '') }, [
        el('header', { class: 'week-day-head' }, [
          el('button', {
            class: 'week-day-label', type: 'button',
            onclick: function () { cursor = d; mode = 'day'; render(); }
          }, [
            el('strong', { text: Dates.JOURS[Dates.weekdayIndex(d)] }),
            el('span', { class: 'muted', text: ' ' + d.getDate() })
          ]),
          el('span', { class: 'week-day-stickers', text: stickers.map(function (s) { return s.emoji; }).join('') }),
          el('button', {
            class: 'icon-btn small', type: 'button', text: '+', 'aria-label': 'Ajouter',
            onclick: function () { EventForm.open({ date: key, onSaved: render }); }
          })
        ]),
        list
      ]));
    });

    return wrap;
  }

  /* ---------- Vue journalière ---------- */

  function renderDay() {
    var key = Dates.toKey(cursor);
    var events = Storage.getEventsByDate(key);
    var stickers = Storage.getStickersByDate(key);
    var wrap = el('div', { class: 'day' });

    /* Bandeau décoration */
    var deco = el('div', { class: 'day-deco' }, [
      el('div', { class: 'day-deco-list', text: stickers.length ? stickers.map(function (s) { return s.emoji; }).join(' ') : '' }),
      el('button', {
        class: 'btn btn-soft small', type: 'button', text: '✨ Décorer',
        onclick: function () { Stickers.open(key, render); }
      })
    ]);
    wrap.appendChild(deco);

    if (!events.length) {
      wrap.appendChild(emptyState('Journée libre… à vous d\'inventer quelque chose 💫', key));
      return wrap;
    }

    /* Événements journée entière : en tête */
    var allDay = events.filter(function (e) { return e.allDay || !e.start; });
    if (allDay.length) {
      var box = el('div', { class: 'day-allday' });
      allDay.forEach(function (evt) { box.appendChild(eventPill(evt)); });
      wrap.appendChild(box);
    }

    /* Timeline horaire */
    var timed = events.filter(function (e) { return !e.allDay && !!e.start; });
    if (timed.length) {
      var range = hourRange(timed);
      var timeline = el('div', { class: 'timeline' });
      for (var h = range.start; h < range.end; h++) {
        timeline.appendChild(el('div', { class: 'tl-row' }, [
          el('span', { class: 'tl-hour', text: Dates.pad(h) + ':00' }),
          el('span', { class: 'tl-line' })
        ]));
      }

      var layer = el('div', { class: 'tl-events' });
      timed.forEach(function (evt) {
        var startMin = Dates.timeToMinutes(evt.start);
        var endMin = Dates.timeToMinutes(evt.end) || (startMin + 60);
        if (endMin <= startMin) endMin = startMin + 60;
        var top = ((startMin - range.start * 60) / 60) * HOUR_HEIGHT;
        var height = Math.max(34, ((endMin - startMin) / 60) * HOUR_HEIGHT - 4);
        var type = Config.typeById(evt.type);

        layer.appendChild(el('button', {
          class: 'tl-evt', type: 'button',
          style: 'top:' + Math.max(0, top) + 'px;height:' + height + 'px;--evt:' + (evt.color || type.color),
          onclick: function () { EventForm.open({ eventId: evt.id, onSaved: render }); }
        }, [
          el('span', { class: 'tl-evt-title', text: type.emoji + ' ' + evt.title }),
          el('span', { class: 'tl-evt-meta', text: evt.start + (evt.end ? ' – ' + evt.end : '') + (evt.place ? ' · ' + evt.place : '') })
        ]));
      });

      wrap.appendChild(el('div', { class: 'timeline-wrap' }, [timeline, layer]));
    }

    return wrap;
  }

  /* ---------- Navigation ---------- */

  function step(direction) {
    if (mode === 'month') cursor = Dates.addMonths(cursor, direction);
    else if (mode === 'week') cursor = Dates.addDays(cursor, 7 * direction);
    else cursor = Dates.addDays(cursor, direction);
    render();
  }

  function label() {
    if (mode === 'month') return Dates.monthLabel(cursor);
    if (mode === 'week') return Dates.weekLabel(cursor);
    return Dates.dayLabelLong(cursor);
  }

  function renderToolbar() {
    var switcher = el('div', { class: 'switcher' });
    [['month', 'Mois'], ['week', 'Semaine'], ['day', 'Jour']].forEach(function (m) {
      switcher.appendChild(el('button', {
        class: 'switcher-btn' + (mode === m[0] ? ' is-active' : ''),
        type: 'button', text: m[1],
        onclick: function () {
          mode = m[0];
          Storage.setSetting('lastView', mode);
          render();
        }
      }));
    });

    return el('div', { class: 'agenda-toolbar' }, [
      el('div', { class: 'nav-row' }, [
        el('button', { class: 'icon-btn', type: 'button', text: '‹', 'aria-label': 'Précédent', onclick: function () { step(-1); } }),
        el('h2', { class: 'nav-label', text: label() }),
        el('button', { class: 'icon-btn', type: 'button', text: '›', 'aria-label': 'Suivant', onclick: function () { step(1); } })
      ]),
      el('div', { class: 'nav-row2' }, [
        switcher,
        el('button', {
          class: 'btn btn-soft small', type: 'button', text: "Aujourd'hui",
          onclick: function () { cursor = new Date(); render(); }
        })
      ])
    ]);
  }

  /* ---------- Rendu principal ---------- */

  function render() {
    if (!root) return;
    UI.clear(root);
    root.appendChild(renderToolbar());
    var body = mode === 'month' ? renderMonth() : mode === 'week' ? renderWeek() : renderDay();
    root.appendChild(body);
  }

  function mount(container) {
    root = container;
    var saved = Storage.getSettings().lastView;
    if (['month', 'week', 'day'].indexOf(saved) >= 0) mode = saved;
    render();
  }

  function focusDate(dateKey, viewMode) {
    cursor = Dates.fromKey(dateKey);
    if (viewMode) mode = viewMode;
  }

  function currentDateKey() { return Dates.toKey(cursor); }

  global.AgendaView = {
    mount: mount,
    render: render,
    focusDate: focusDate,
    currentDateKey: currentDateKey
  };
})(window);
