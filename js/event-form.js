/* ============================================================
   EventForm — création / édition d'un événement
   ============================================================ */
(function (global) {
  'use strict';

  var el = UI.el;
  var overlay = null;
  var releaseTrap = null;
  var previousFocus = null;
  var onSaved = null;
  var uidSeed = 0;

  function nextId(prefix) { uidSeed += 1; return prefix + '-' + uidSeed; }

  function close() {
    if (!overlay) return;
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    overlay.classList.remove('is-open');
    var node = overlay;
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 180);
    overlay = null;
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  // NB : volontairement un <div> et non un <label>. Un <label> renvoie le clic
  // vers le premier élément activable qu'il contient, ce qui casserait les
  // groupes de boutons (types, couleurs, participants).
  function field(labelText, control, opts) {
    opts = opts || {};
    var labelNode;
    if (opts.for) {
      labelNode = el('label', { class: 'field-label', for: opts.for, text: labelText });
    } else {
      labelNode = el('span', { class: 'field-label', id: opts.labelledBy, text: labelText });
    }
    return el('div', { class: 'field' }, [
      labelNode,
      control,
      opts.hint ? el('span', { class: 'field-hint', text: opts.hint }) : null,
      opts.error ? el('span', { class: 'field-error', role: 'alert', text: opts.error }) : null
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
      allDay: false,
      start: '19:00',
      end: '',
      color: Config.typeById('date').color,
      place: '',
      who: 'both',
      reminder: 'none',
      notes: ''
    };

    var ids = {
      title: nextId('f-title'),
      date: nextId('f-date'),
      start: nextId('f-start'),
      end: nextId('f-end'),
      place: nextId('f-place'),
      notes: nextId('f-notes'),
      typeGroup: nextId('lbl-type'),
      colorGroup: nextId('lbl-color'),
      whoGroup: nextId('lbl-who'),
      allDay: nextId('lbl-allday')
    };

    var errorBox = el('div', { class: 'form-errors', hidden: true, role: 'alert' });

    /* --- Champs --- */
    var titleInput = el('input', {
      id: ids.title, type: 'text', class: 'input', value: data.title,
      placeholder: 'Ex : Resto italien 🍝', maxlength: '80'
    });

    var typeRow = el('div', { class: 'chip-row', role: 'group', 'aria-labelledby': ids.typeGroup });
    Config.EVENT_TYPES.forEach(function (t) {
      var chip = el('button', {
        type: 'button',
        class: 'chip' + (data.type === t.id ? ' is-active' : ''),
        'aria-pressed': data.type === t.id ? 'true' : 'false',
        'data-type': t.id,
        onclick: function () {
          data.type = t.id;
          typeRow.querySelectorAll('.chip').forEach(function (c) {
            c.classList.remove('is-active');
            c.setAttribute('aria-pressed', 'false');
          });
          chip.classList.add('is-active');
          chip.setAttribute('aria-pressed', 'true');
          // La couleur suit le type tant que l'utilisateur ne l'a pas forcée
          if (!data.colorTouched) {
            data.color = t.color;
            paintColors();
          }
        }
      }, [el('span', { text: t.emoji, 'aria-hidden': 'true' }), el('span', { text: t.label })]);
      typeRow.appendChild(chip);
    });

    var dateInput = el('input', { id: ids.date, type: 'date', class: 'input', value: data.date });
    var startInput = el('input', { id: ids.start, type: 'time', class: 'input', value: data.start || '' });
    var endInput = el('input', { id: ids.end, type: 'time', class: 'input', value: data.end || '' });

    /* Journée entière : trois cas clairs -> journée entière, début seul, début+fin */
    var allDayToggle = el('button', {
      type: 'button',
      class: 'switch' + (data.allDay ? ' is-on' : ''),
      role: 'switch',
      'aria-checked': data.allDay ? 'true' : 'false',
      'aria-labelledby': ids.allDay,
      onclick: function () {
        data.allDay = !data.allDay;
        allDayToggle.classList.toggle('is-on', data.allDay);
        allDayToggle.setAttribute('aria-checked', data.allDay ? 'true' : 'false');
        timeFields.hidden = data.allDay;
        if (data.allDay) {
          if (!data._savedStart) data._savedStart = startInput.value;
          if (!data._savedEnd) data._savedEnd = endInput.value;
        } else if (!startInput.value) {
          startInput.value = data._savedStart || '19:00';
          endInput.value = data._savedEnd || '';
        }
      }
    }, [el('span', { class: 'switch-knob' })]);

    var timeFields = el('div', { class: 'field-grid', hidden: !!data.allDay }, [
      field('Début', startInput, { for: ids.start }),
      field('Fin', endInput, { for: ids.end, hint: 'Facultatif' })
    ]);

    var colorRow = el('div', { class: 'color-row', role: 'group', 'aria-labelledby': ids.colorGroup });
    function paintColors() {
      UI.clear(colorRow);
      Config.COLORS.forEach(function (c) {
        colorRow.appendChild(el('button', {
          type: 'button',
          class: 'swatch' + (data.color === c ? ' is-active' : ''),
          style: '--swatch:' + c,
          'aria-pressed': data.color === c ? 'true' : 'false',
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
      id: ids.place, type: 'text', class: 'input', value: data.place || '',
      placeholder: 'Ex : Chez Luigi, Paris 11e', maxlength: '80'
    });

    var whoRow = el('div', { class: 'chip-row', role: 'group', 'aria-labelledby': ids.whoGroup });
    Config.WHO.forEach(function (w) {
      var chip = el('button', {
        type: 'button',
        class: 'chip' + (data.who === w.id ? ' is-active' : ''),
        'aria-pressed': data.who === w.id ? 'true' : 'false',
        onclick: function () {
          data.who = w.id;
          whoRow.querySelectorAll('.chip').forEach(function (c) {
            c.classList.remove('is-active');
            c.setAttribute('aria-pressed', 'false');
          });
          chip.classList.add('is-active');
          chip.setAttribute('aria-pressed', 'true');
        }
      }, [el('span', { text: w.emoji, 'aria-hidden': 'true' }), el('span', { text: Config.whoLabel(w.id, settings) })]);
      whoRow.appendChild(chip);
    });

    // Le champ "Rappel" reste dans le schéma de données pour compatibilité
    // future, mais n'est plus affiché : aucune notification n'est réellement
    // déclenchée pour l'instant, on évite de simuler une fonctionnalité absente.
    var reminderValue = Config.REMINDERS.some(function (r) { return r.id === data.reminder; }) ? data.reminder : 'none';

    var notesInput = el('textarea', {
      id: ids.notes, class: 'input textarea', rows: '4',
      placeholder: 'Note libre : idées, budget, tenue, cadeau…'
    });
    notesInput.value = data.notes || '';

    /* --- Enregistrement --- */
    function showErrors(messages) {
      UI.clear(errorBox);
      messages.forEach(function (m) { errorBox.appendChild(el('p', { text: m })); });
      errorBox.hidden = messages.length === 0;
    }

    function submit() {
      var payload = {
        id: existing ? existing.id : undefined,
        title: titleInput.value,
        type: data.type,
        date: dateInput.value,
        allDay: data.allDay,
        start: startInput.value || '',
        end: endInput.value || '',
        color: data.color,
        place: placeInput.value,
        who: data.who,
        reminder: reminderValue,
        notes: notesInput.value
      };

      var result = Storage.saveEvent(payload);

      if (!result.ok) {
        if (result.code === 'validation') {
          showErrors(result.errors.map(function (e) { return e.message; }));
        } else if (result.code === 'quota') {
          showErrors([result.message]);
        } else {
          showErrors([result.message || "Une erreur est survenue, l'événement n'a pas été enregistré."]);
        }
        return;
      }

      showErrors([]);
      UI.toast(isEdit ? 'Événement mis à jour ✨' : 'Événement ajouté 🎉');
      close();
      if (onSaved) onSaved(payload.date);
    }

    function remove() {
      if (!existing) return;
      UI.confirmDialog({
        title: 'Supprimer cet événement ?',
        message: '« ' + existing.title + ' » sera définitivement supprimé.',
        confirmLabel: 'Supprimer',
        danger: true,
        onConfirm: function () {
          var result = Storage.deleteEvent(existing.id);
          if (!result.ok) {
            UI.toast(result.message || 'Suppression impossible');
            return;
          }
          UI.toast('Événement supprimé');
          close();
          if (onSaved) onSaved(existing.date);
        }
      });
    }

    /* --- Assemblage --- */
    var sheet = el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': isEdit ? 'Modifier l\'événement' : 'Nouvel événement' }, [
      el('div', { class: 'sheet-grip', 'aria-hidden': 'true' }),
      el('header', { class: 'sheet-head' }, [
        el('h2', { class: 'sheet-title', text: isEdit ? 'Modifier l\'événement' : 'Nouvel événement' }),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fermer', text: '✕', onclick: close })
      ]),
      el('div', { class: 'sheet-body' }, [
        errorBox,
        field('Titre', titleInput, { for: ids.title }),
        field('Type', typeRow, { labelledBy: ids.typeGroup }),
        field('Date', dateInput, { for: ids.date }),
        el('div', { class: 'field' }, [
          el('div', { class: 'switch-row' }, [
            el('span', { class: 'field-label', id: ids.allDay, text: 'Journée entière' }),
            allDayToggle
          ])
        ]),
        timeFields,
        field('Couleur', colorRow, { labelledBy: ids.colorGroup }),
        field('Lieu', placeInput, { for: ids.place }),
        field('Qui ?', whoRow, { labelledBy: ids.whoGroup }),
        field('Notes', notesInput, { for: ids.notes })
      ]),
      el('footer', { class: 'sheet-foot' }, [
        isEdit ? el('button', { class: 'btn btn-ghost btn-danger', type: 'button', text: 'Supprimer', onclick: remove }) : null,
        el('button', { class: 'btn btn-primary', type: 'button', text: isEdit ? 'Enregistrer' : 'Ajouter', onclick: submit })
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
    setTimeout(function () { titleInput.focus(); }, 200);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay) close();
  });

  global.EventForm = { open: open, close: close };
})(window);
