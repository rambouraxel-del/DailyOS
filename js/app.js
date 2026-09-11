/* ============================================================
   App — amorçage, navigation, mise à jour
   ============================================================ */
(function (global) {
  'use strict';

  var el = UI.el;
  var current = 'home';

  var SCREENS = {
    home:     { id: 'home',     label: 'Accueil', emoji: '🏠', view: function () { return HomeView; } },
    agenda:   { id: 'agenda',   label: 'Agenda',  emoji: '📅', view: function () { return AgendaView; } },
    settings: { id: 'settings', label: 'Réglages', emoji: '⚙️', view: function () { return SettingsView; } }
  };

  var container, tabbar, fab;

  function go(screenId) {
    if (!SCREENS[screenId]) screenId = 'home';
    current = screenId;
    UI.clear(container);
    container.scrollTop = 0;
    var host = el('div', { class: 'screen screen-' + screenId });
    container.appendChild(host);
    SCREENS[screenId].view().mount(host);
    paintTabs();
    fab.hidden = (screenId === 'settings');
  }

  function paintTabs() {
    UI.clear(tabbar);
    Object.keys(SCREENS).forEach(function (key) {
      var s = SCREENS[key];
      tabbar.appendChild(el('button', {
        class: 'tab' + (current === key ? ' is-active' : ''),
        type: 'button',
        'aria-current': current === key ? 'page' : null,
        onclick: function () { go(key); }
      }, [
        el('span', { class: 'tab-emoji', text: s.emoji }),
        el('span', { class: 'tab-label', text: s.label })
      ]));
    });
  }

  function refreshCurrent() {
    var view = SCREENS[current].view();
    if (view && view.render) view.render();
  }

  function boot() {
    container = document.getElementById('view');
    tabbar = document.getElementById('tabbar');
    fab = document.getElementById('fab');

    Storage.load();
    Themes.apply(Storage.getSettings().theme);

    fab.addEventListener('click', function () {
      var date = current === 'agenda' ? AgendaView.currentDateKey() : Dates.todayKey();
      EventForm.open({
        date: date,
        onSaved: function (savedDate) {
          if (current === 'agenda') {
            AgendaView.focusDate(savedDate);
            AgendaView.render();
          } else {
            refreshCurrent();
          }
        }
      });
    });

    // Toute écriture dans la mémoire interne rafraîchit l'écran courant
    Storage.subscribe(function () {
      if (current === 'home') HomeView.render();
    });

    go('home');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('service-worker.js').catch(function () { /* hors-ligne : ignoré */ });
      });
    }
  }

  global.App = { go: go, boot: boot };
  document.addEventListener('DOMContentLoaded', boot);
})(window);
