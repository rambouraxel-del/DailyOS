/* ============================================================
   Vue Réglages — thème, prénoms, sauvegarde des données
   ============================================================ */
(function (global) {
  'use strict';

  var el = UI.el;
  var root = null;

  function themePicker(settings) {
    var grid = el('div', { class: 'theme-grid' });
    Config.THEMES.forEach(function (t) {
      grid.appendChild(el('button', {
        class: 'theme-card theme-preview-' + t.id + (settings.theme === t.id ? ' is-active' : ''),
        type: 'button',
        onclick: function () {
          Storage.setSetting('theme', t.id);
          Themes.apply(t.id);
          UI.toast('Thème « ' + t.label + ' » appliqué ' + t.emoji);
          render();
        }
      }, [
        el('span', { class: 'theme-emoji', text: t.emoji }),
        el('span', { class: 'theme-label', text: t.label }),
        el('span', { class: 'theme-dots' }, [
          el('i', { class: 'td td1' }), el('i', { class: 'td td2' }), el('i', { class: 'td td3' })
        ])
      ]));
    });
    return grid;
  }

  function downloadBackup() {
    var json = Storage.exportJSON();
    var stamp = Dates.todayKey();
    try {
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = el('a', { href: url, download: 'nous-deux-' + stamp + '.json' });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      UI.toast('Sauvegarde exportée 💾');
    } catch (err) {
      // Repli : on affiche le JSON pour copie manuelle
      global.prompt('Copiez cette sauvegarde :', json);
    }
  }

  function importBackup(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        Storage.importJSON(String(reader.result));
        Themes.apply(Storage.getSettings().theme);
        UI.toast('Sauvegarde restaurée ✅');
        render();
      } catch (err) {
        UI.toast('Fichier illisible 😕');
      }
    };
    reader.readAsText(file);
  }

  function render() {
    if (!root) return;
    UI.clear(root);
    var settings = Storage.getSettings();

    root.appendChild(el('header', { class: 'home-head' }, [
      el('h1', { class: 'home-title', text: 'Réglages' })
    ]));

    /* --- Thème --- */
    root.appendChild(el('h3', { class: 'section-title', text: 'Apparence' }));
    root.appendChild(themePicker(settings));

    /* --- Prénoms --- */
    root.appendChild(el('h3', { class: 'section-title', text: 'Le couple' }));
    var inputA = el('input', { class: 'input', type: 'text', value: settings.partnerA, maxlength: '24' });
    var inputB = el('input', { class: 'input', type: 'text', value: settings.partnerB, maxlength: '24' });
    function saveNames() {
      Storage.setSetting('partnerA', inputA.value.trim() || 'Moi');
      Storage.setSetting('partnerB', inputB.value.trim() || 'Toi');
    }
    inputA.addEventListener('change', saveNames);
    inputB.addEventListener('change', saveNames);
    root.appendChild(el('div', { class: 'card' }, [
      el('label', { class: 'field' }, [el('span', { class: 'field-label', text: 'Prénom 1' }), inputA]),
      el('label', { class: 'field' }, [el('span', { class: 'field-label', text: 'Prénom 2' }), inputB])
    ]));

    /* --- Données --- */
    root.appendChild(el('h3', { class: 'section-title', text: 'Mes données' }));
    var nbEvents = Storage.getEvents().length;
    var nbStickers = Storage.getStickers().length;
    var fileInput = el('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) importBackup(fileInput.files[0]);
    });

    root.appendChild(el('div', { class: 'card' }, [
      el('p', { class: 'muted small', text:
        'Tout est enregistré sur cet appareil et conservé d\'une session à l\'autre, ' +
        'y compris après une mise à jour de l\'application (schéma v' + Storage.SCHEMA_VERSION + ').' }),
      el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-soft', type: 'button', text: '💾 Exporter', onclick: downloadBackup }),
        el('button', { class: 'btn btn-soft', type: 'button', text: '📥 Importer', onclick: function () { fileInput.click(); } })
      ]),
      fileInput,
      el('div', { class: 'stats' }, [
        el('div', { class: 'stat' }, [
          el('strong', { text: String(nbEvents) }),
          el('span', { text: nbEvents > 1 ? 'événements' : 'événement' })
        ]),
        el('div', { class: 'stat' }, [
          el('strong', { text: String(nbStickers) }),
          el('span', { text: nbStickers > 1 ? 'autocollants' : 'autocollant' })
        ])
      ]),
      el('button', {
        class: 'btn btn-ghost btn-danger full', type: 'button', text: 'Tout effacer',
        onclick: function () {
          if (!UI.confirmBox('Effacer tous les événements et réglages ? Cette action est irréversible.')) return;
          Storage.resetAll();
          Themes.apply(Storage.getSettings().theme);
          UI.toast('Application réinitialisée');
          render();
        }
      })
    ]));

    root.appendChild(el('p', { class: 'muted small center version', text: 'Nous Deux · v' + (global.APP_VERSION || '1.0.0') }));
  }

  function mount(container) {
    root = container;
    render();
  }

  global.SettingsView = { mount: mount, render: render };
})(window);
