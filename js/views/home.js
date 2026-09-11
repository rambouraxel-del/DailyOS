/* ============================================================
   Vue Accueil — prochains événements & compteurs
   ============================================================ */
(function (global) {
  'use strict';

  var el = UI.el;
  var root = null;

  function upcoming(limit) {
    var todayKey = Dates.todayKey();
    return Storage.getEvents()
      .filter(function (e) { return e.date >= todayKey; })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return (a.start || '99:99').localeCompare(b.start || '99:99');
      })
      .slice(0, limit || 6);
  }

  function heroCard(evt, settings) {
    var type = Config.typeById(evt.type);
    return el('article', {
      class: 'hero-card', style: '--evt:' + (evt.color || type.color),
      onclick: function () { EventForm.open({ eventId: evt.id, onSaved: render }); }
    }, [
      el('div', { class: 'hero-count', text: Dates.countdownLabel(evt.date) }),
      el('h2', { class: 'hero-title', text: type.emoji + ' ' + evt.title }),
      el('p', { class: 'hero-meta', text: Dates.dayLabel(Dates.fromKey(evt.date)) + (evt.start ? ' · ' + evt.start : '') }),
      evt.place ? el('p', { class: 'hero-meta', text: '📍 ' + evt.place }) : null,
      el('p', { class: 'hero-meta', text: Config.whoEmoji(evt.who) + ' ' + Config.whoLabel(evt.who, settings) })
    ]);
  }

  function listRow(evt, settings) {
    var type = Config.typeById(evt.type);
    var d = Dates.fromKey(evt.date);
    return el('button', {
      class: 'row', type: 'button', style: '--evt:' + (evt.color || type.color),
      onclick: function () { EventForm.open({ eventId: evt.id, onSaved: render }); }
    }, [
      el('div', { class: 'row-date' }, [
        el('span', { class: 'row-day', text: String(d.getDate()) }),
        el('span', { class: 'row-month', text: Dates.MOIS[d.getMonth()].slice(0, 3).toLowerCase() })
      ]),
      el('div', { class: 'row-main' }, [
        el('span', { class: 'row-title', text: type.emoji + ' ' + evt.title }),
        el('span', { class: 'row-meta', text: [
          evt.start || null,
          evt.place || null,
          Config.whoLabel(evt.who, settings)
        ].filter(Boolean).join(' · ') })
      ]),
      el('span', { class: 'row-count', text: Dates.countdownLabel(evt.date) })
    ]);
  }

  function render() {
    if (!root) return;
    UI.clear(root);
    var settings = Storage.getSettings();
    var events = upcoming(7);
    var all = Storage.getEvents();

    root.appendChild(el('header', { class: 'home-head' }, [
      el('p', { class: 'home-hello', text: 'Bonjour ' + (settings.partnerA || '') + ' & ' + (settings.partnerB || '') + ' 💞' }),
      el('h1', { class: 'home-title', text: 'Nous Deux' }),
      el('p', { class: 'muted small', text: Dates.dayLabelLong(new Date()) })
    ]));

    if (!events.length) {
      root.appendChild(el('div', { class: 'empty' }, [
        el('div', { class: 'empty-emoji', text: '💌' }),
        el('p', { class: 'muted', text: all.length
          ? 'Plus rien de prévu devant vous… on planifie quelque chose ?'
          : 'Aucun événement pour l\'instant. Créez votre premier souvenir !' }),
        el('button', {
          class: 'btn btn-primary', type: 'button', text: '+ Créer un événement',
          onclick: function () { EventForm.open({ onSaved: function () { App.go('agenda'); } }); }
        })
      ]));
      return;
    }

    root.appendChild(heroCard(events[0], settings));

    if (events.length > 1) {
      root.appendChild(el('h3', { class: 'section-title', text: 'À venir' }));
      var list = el('div', { class: 'list' });
      events.slice(1).forEach(function (evt) { list.appendChild(listRow(evt, settings)); });
      root.appendChild(list);
    }

    root.appendChild(el('div', { class: 'stats' }, [
      el('div', { class: 'stat' }, [
        el('strong', { text: String(all.length) }),
        el('span', { text: all.length > 1 ? 'événements' : 'événement' })
      ]),
      el('div', { class: 'stat' }, [
        el('strong', { text: String(Storage.getStickers().length) }),
        el('span', { text: Storage.getStickers().length > 1 ? 'autocollants' : 'autocollant' })
      ])
    ]));
  }

  function mount(container) {
    root = container;
    render();
  }

  global.HomeView = { mount: mount, render: render };
})(window);
