/* ============================================================
   Vue Réglages — thème, prénoms, sauvegarde des données
   ============================================================ */
(function (global) {
  'use strict';

  var el = UI.el;
  var root = null;

  function themePicker(settings) {
    var grid = el('div', { class: 'theme-grid', role: 'group', 'aria-label': 'Thème de l\'application' });
    Config.THEMES.forEach(function (t) {
      grid.appendChild(el('button', {
        class: 'theme-card theme-preview-' + t.id + (settings.theme === t.id ? ' is-active' : ''),
        type: 'button',
        'aria-pressed': settings.theme === t.id ? 'true' : 'false',
        onclick: function () {
          var result = Storage.setSetting('theme', t.id);
          if (!result.ok) {
            UI.toast(result.message || 'Impossible d\'enregistrer le thème');
            return;
          }
          Themes.apply(t.id);
          UI.toast('Thème « ' + t.label + ' » appliqué ' + t.emoji);
          render();
        }
      }, [
        el('span', { class: 'theme-emoji', text: t.emoji, 'aria-hidden': 'true' }),
        el('span', { class: 'theme-label', text: t.label }),
        el('span', { class: 'theme-dots', 'aria-hidden': 'true' }, [
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

  function applyImportResult(result) {
    if (!result.ok) {
      var messages = {
        parse: 'Ce fichier n\'est pas lisible (JSON invalide).',
        structure: 'Ce fichier ne ressemble pas à une sauvegarde Nous Deux.',
        quota: result.message,
        write: 'Impossible d\'écrire les données restaurées sur cet appareil.'
      };
      UI.toast(messages[result.code] || result.message || 'Import impossible');
      return;
    }
    Themes.apply(Storage.getSettings().theme);
    UI.toast('Sauvegarde restaurée ✅');
    render();
  }

  function importBackup(file) {
    UI.confirmDialog({
      title: 'Remplacer les données actuelles ?',
      message: 'Importer ce fichier remplacera tous les événements, autocollants et réglages actuellement sur cet appareil. Une copie de sécurité de l\'état actuel est conservée localement.',
      confirmLabel: 'Importer',
      danger: true,
      onConfirm: function () {
        var reader = new FileReader();
        reader.onload = function () {
          applyImportResult(Storage.importJSON(String(reader.result)));
        };
        reader.onerror = function () {
          UI.toast('Impossible de lire ce fichier');
        };
        reader.readAsText(file);
      }
    });
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
    var idA = 'settings-partner-a', idB = 'settings-partner-b';
    var inputA = el('input', { id: idA, class: 'input', type: 'text', value: settings.partnerA, maxlength: '24' });
    var inputB = el('input', { id: idB, class: 'input', type: 'text', value: settings.partnerB, maxlength: '24' });
    function saveNames() {
      var resultA = Storage.setSetting('partnerA', inputA.value.trim() || 'Moi');
      var resultB = resultA.ok ? Storage.setSetting('partnerB', inputB.value.trim() || 'Toi') : resultA;
      if (!resultB.ok) UI.toast(resultB.message || 'Impossible d\'enregistrer');
    }
    inputA.addEventListener('change', saveNames);
    inputB.addEventListener('change', saveNames);
    root.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'field' }, [el('label', { class: 'field-label', for: idA, text: 'Prénom 1' }), inputA]),
      el('div', { class: 'field' }, [el('label', { class: 'field-label', for: idB, text: 'Prénom 2' }), inputB])
    ]));

    /* --- Données --- */
    root.appendChild(el('h3', { class: 'section-title', text: 'Mes données' }));
    var nbEvents = Storage.getEvents().length;
    var nbStickers = Storage.getStickers().length;
    var fileInput = el('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) importBackup(fileInput.files[0]);
      fileInput.value = '';
    });

    root.appendChild(el('div', { class: 'card' }, [
      el('p', { class: 'muted small', text:
        'Vos données sont stockées uniquement sur cet appareil (schéma v' + Storage.SCHEMA_VERSION + '). ' +
        'Elles ne sont pas envoyées ailleurs : pensez à exporter régulièrement une sauvegarde, ' +
        'notamment avant de changer d\'appareil.' }),
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
          UI.confirmDialog({
            title: 'Tout effacer ?',
            message: 'Tous les événements, autocollants et réglages seront supprimés de cet appareil. Cette action est irréversible.',
            confirmLabel: 'Tout effacer',
            danger: true,
            onConfirm: function () {
              var result = Storage.resetAll();
              if (!result.ok) {
                UI.toast(result.message || 'Impossible de réinitialiser');
                return;
              }
              Themes.apply(Storage.getSettings().theme);
              UI.toast('Application réinitialisée');
              render();
            }
          });
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
