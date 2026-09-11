/* ============================================================
   Stickers — décoration de l'agenda
   ============================================================ */
(function (global) {
  'use strict';

  var el = UI.el;
  var overlay = null;
  var releaseTrap = null;
  var previousFocus = null;

  function close() {
    if (!overlay) return;
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    overlay.classList.remove('is-open');
    var node = overlay;
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 180);
    overlay = null;
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  function open(dateKey, onChange) {
    var grid = el('div', { class: 'sticker-grid' });
    var current = el('div', { class: 'sticker-current' });

    function refreshCurrent() {
      UI.clear(current);
      var list = Storage.getStickersByDate(dateKey);
      if (!list.length) {
        current.appendChild(el('p', { class: 'muted small', text: 'Aucun autocollant sur cette journée.' }));
        return;
      }
      list.forEach(function (s) {
        current.appendChild(el('button', {
          class: 'sticker-chip', type: 'button', 'aria-label': 'Retirer ' + s.emoji,
          onclick: function () {
            var result = Storage.removeSticker(s.id);
            if (!result.ok) { UI.toast(result.message || 'Suppression impossible'); return; }
            refreshCurrent();
            if (onChange) onChange();
          }
        }, [el('span', { text: s.emoji, 'aria-hidden': 'true' }), el('span', { class: 'sticker-x', 'aria-hidden': 'true', text: '✕' })]));
      });
    }

    Config.STICKERS.forEach(function (emoji) {
      grid.appendChild(el('button', {
        class: 'sticker-pick', type: 'button', text: emoji, 'aria-label': 'Ajouter ' + emoji,
        onclick: function () {
          var result = Storage.addSticker(dateKey, emoji);
          if (!result.ok) { UI.toast(result.message || 'Ajout impossible'); return; }
          refreshCurrent();
          if (onChange) onChange();
        }
      }));
    });

    refreshCurrent();

    var sheet = el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' }, [
      el('div', { class: 'sheet-grip' }),
      el('header', { class: 'sheet-head' }, [
        el('h2', { class: 'sheet-title', text: 'Décorer le ' + Dates.fromKey(dateKey).getDate() + ' ' + Dates.MOIS[Dates.fromKey(dateKey).getMonth()].toLowerCase() }),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fermer', text: '✕', onclick: close })
      ]),
      el('div', { class: 'sheet-body' }, [
        el('p', { class: 'field-label', text: 'Sur cette journée' }),
        current,
        el('p', { class: 'field-label', text: 'Ajouter' }),
        grid
      ]),
      el('footer', { class: 'sheet-foot' }, [
        el('button', { class: 'btn btn-primary', type: 'button', text: 'Terminé', onclick: close })
      ])
    ]);

    previousFocus = document.activeElement;
    overlay = el('div', {
      class: 'overlay',
      onclick: function (e) { if (e.target === overlay) close(); }
    }, [sheet]);

    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    releaseTrap = UI.trapFocus(sheet);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay) close();
  });

  global.Stickers = { open: open, close: close };
})(window);
