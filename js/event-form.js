/* ============================================================
   EventForm — création / édition d'un événement
   ============================================================ */
(function (global) {
  'use strict';

  var el = UI.el;
  var overlay = null;
  var onSaved = null;

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    var node = overlay;
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 180);
    overlay = null;
  }

  // NB : volontairement un <div> et non un <label>. Un <label> renvoie le clic
  // vers le premier élément activable qu'il contient, ce qui casserait les
  // groupes de boutons (types, couleurs, participants).
  function field(label, control, hint) {
    return el('div', { class: 'field' }, [
      el('span', { class: 'field-label', text: label }),
      control,
      hint ? el('span', { class: 'field-hint', text: hint }) : null
    ]);
  }

  function open(options) {
    options = options || {};
    onSaved = options.onSaved || null;
    var settings = Storage.getSettings();
    var existing = options.eventId ? Storage.getEvent(options.eventId) : null;
    var isEdit = !!existing;

    var data = existing ? Object.assign({}, existing) : {
      title: '',
      type: 'date',
      date: options.date || Dates.todayKey(),
      start: '19:00',
      end: '',
      color: Config.typeById('date').color,
      place: '',
      who: 'both',
      reminder: 'none',
      notes: ''
    };

    /* --- Champs --- */
    var titleInput = el('input', {
      type: 'text', class: 'input', value: data.title,
      placeholder: 'Ex : Resto italien 🍝', maxlength: '80'
    });

    var typeRow = el('div', { class: 'chip-row' });
    Config.EVENT_TYPES.forEach(function (t) {
      var chip = el('button', {
        type: 'button',
        class: 'chip' + (data.type === t.id ? ' is-active' : ''),
        'data-type': t.id,
        onclick: function () {
          data.type = t.id;
          typeRow.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
          chip.classList.add('is-active');
          // La couleur suit le type tant que l'utilisateur ne l'a pas forcée
          if (!data.colorTouched) {
            data.color = t.color;
            paintColors();
          }
        }
      }, [el('span', { text: t.emoji }), el('span', { text: t.label })]);
      typeRow.appendChild(chip);
    });

    var dateInput = el('input', { type: 'date', class: 'input', value: data.date });
    var startInput = el('input', { type: 'time', class: 'input', value: data.start || '' });
    var endInput = el('input', { type: 'time', class: 'input', value: data.end || '' });

    var colorRow = el('div', { class: 'color-row' });
    function paintColors() {
      UI.clear(colorRow);
      Config.COLORS.forEach(function (c) {
        colorRow.appendChild(el('button', {
          type: 'button',
          class: 'swatch' + (data.color === c ? ' is-active' : ''),
          style: '--swatch:' + c,
          'aria-label': 'Couleur ' + c,
          onclick: function () {
            data.color = c;
            data.colorTouched = true;
            paintColors();
          }
        }));
      });
    }
    paintColors();

    var placeInput = el('input', {
      type: 'text', class: 'input', value: data.place || '',
      placeholder: 'Ex : Chez Luigi, Paris 11e', maxlength: '80'
    });

    var whoRow = el('div', { class: 'chip-row' });
    Config.WHO.forEach(function (w) {
      var chip = el('button', {
        type: 'button',
        class: 'chip' + (data.who === w.id ? ' is-active' : ''),
        onclick: function () {
          data.who = w.id;
          whoRow.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
          chip.classList.add('is-active');
        }
      }, [el('span', { text: w.emoji }), el('span', { text: Config.whoLabel(w.id, settings) })]);
      whoRow.appendChild(chip);
    });

    var reminderSelect = el('select', { class: 'input' },
      Config.REMINDERS.map(function (r) {
        return el('option', { value: r.id, text: r.label, selected: data.reminder === r.id });
      })
    );

    var notesInput = el('textarea', {
      class: 'input textarea', rows: '4',
      placeholder: 'Note libre : idées, budget, tenue, cadeau…'
    });
    notesInput.value = data.notes || '';

    /* --- Enregistrement --- */
    function submit() {
      var title = titleInput.value.trim();
      if (!title) {
        UI.toast('Il manque un titre 🙈');
        titleInput.focus();
        return;
      }
      if (!dateInput.value) {
        UI.toast('Il manque une date 📅');
        return;
      }
      var payload = {
        id: existing ? existing.id : undefined,
        title: title,
        type: data.type,
        date: dateInput.value,
        start: startInput.value || '',
        end: endInput.value || '',
        color: data.color,
        place: placeInput.value.trim(),
        who: data.who,
        reminder: reminderSelect.value,
        notes: notesInput.value
      };
      Storage.saveEvent(payload);
      UI.toast(isEdit ? 'Événement mis à jour ✨' : 'Événement ajouté 🎉');
      close();
      if (onSaved) onSaved(payload.date);
    }

    function remove() {
      if (!existing) return;
      if (!UI.confirmBox('Supprimer « ' + existing.title + ' » ?')) return;
      Storage.deleteEvent(existing.id);
      UI.toast('Événement supprimé');
      close();
      if (onSaved) onSaved(existing.date);
    }

    /* --- Assemblage --- */
    var sheet = el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' }, [
      el('div', { class: 'sheet-grip' }),
      el('header', { class: 'sheet-head' }, [
        el('h2', { class: 'sheet-title', text: isEdit ? 'Modifier l\'événement' : 'Nouvel événement' }),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fermer', text: '✕', onclick: close })
      ]),
      el('div', { class: 'sheet-body' }, [
        field('Titre', titleInput),
        field('Type', typeRow),
        el('div', { class: 'field-grid' }, [
          field('Date', dateInput),
          field('Début', startInput),
          field('Fin', endInput)
        ]),
        field('Couleur', colorRow),
        field('Lieu', placeInput),
        field('Qui ?', whoRow),
        field('Rappel', reminderSelect),
        field('Notes', notesInput)
      ]),
      el('footer', { class: 'sheet-foot' }, [
        isEdit ? el('button', { class: 'btn btn-ghost btn-danger', type: 'button', text: 'Supprimer', onclick: remove }) : null,
        el('button', { class: 'btn btn-primary', type: 'button', text: isEdit ? 'Enregistrer' : 'Ajouter', onclick: submit })
      ])
    ]);

    overlay = el('div', {
      class: 'overlay',
      onclick: function (e) { if (e.target === overlay) close(); }
    }, [sheet]);

    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    setTimeout(function () { titleInput.focus(); }, 200);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay) close();
  });

  global.EventForm = { open: open, close: close };
})(window);
