/* ============================================================
   Config — types d'événements, couleurs, thèmes, stickers
   ============================================================ */
(function (global) {
  'use strict';

  var EVENT_TYPES = [
    { id: 'anniversaire', label: 'Anniversaire', emoji: '🎂', color: '#f4a3c0' },
    { id: 'date',         label: 'Date',         emoji: '💕', color: '#ef6f8e' },
    { id: 'soiree',       label: 'Soirée',       emoji: '🎉', color: '#a98bf0' },
    { id: 'sortie',       label: 'Sortie',       emoji: '🌿', color: '#5fc7a4' }
  ];

  var COLORS = [
    '#ef6f8e', '#f4a3c0', '#f9a94e', '#f2d04b',
    '#5fc7a4', '#4fb3d9', '#a98bf0', '#8d9bb5'
  ];

  var WHO = [
    { id: 'both', label: 'Nous deux', emoji: '💞' },
    { id: 'a',    label: 'partnerA',  emoji: '🙂' },
    { id: 'b',    label: 'partnerB',  emoji: '😊' }
  ];

  var REMINDERS = [
    { id: 'none',   label: 'Aucun rappel' },
    { id: '1h',     label: '1 heure avant' },
    { id: '1d',     label: 'La veille' },
    { id: '1w',     label: 'Une semaine avant' }
  ];

  var STICKERS = [
    '❤️', '💕', '💖', '💘', '😍', '🥰', '😘',
    '⭐', '✨', '🌟', '🌙', '☀️', '🌈', '🔥',
    '🌸', '🌺', '🌷', '🌻', '🍀', '🌴', '🦋',
    '🍕', '🍓', '🍾', '🥂', '🍿', '🎬', '🎵',
    '🎁', '🎈', '🎂', '🏖️', '✈️', '🚗', '⛰️'
  ];

  var THEMES = [
    { id: 'light',  label: 'Clair',  emoji: '☀️' },
    { id: 'dark',   label: 'Sombre', emoji: '🌙' },
    { id: 'love',   label: 'Amour',  emoji: '💗' },
    { id: 'nature', label: 'Nature', emoji: '🌿' },
    { id: 'space',  label: 'Espace', emoji: '🪐' }
  ];

  function typeById(id) {
    var f = EVENT_TYPES.filter(function (t) { return t.id === id; });
    return f.length ? f[0] : EVENT_TYPES[1];
  }

  /** Libellé du participant, en tenant compte des prénoms saisis */
  function whoLabel(id, settings) {
    if (id === 'a') return settings.partnerA || 'Moi';
    if (id === 'b') return settings.partnerB || 'Toi';
    return 'Nous deux';
  }

  function whoEmoji(id) {
    var f = WHO.filter(function (w) { return w.id === id; });
    return f.length ? f[0].emoji : '💞';
  }

  function reminderLabel(id) {
    var f = REMINDERS.filter(function (r) { return r.id === id; });
    return f.length ? f[0].label : 'Aucun rappel';
  }

  global.Config = {
    EVENT_TYPES: EVENT_TYPES,
    COLORS: COLORS,
    WHO: WHO,
    REMINDERS: REMINDERS,
    STICKERS: STICKERS,
    THEMES: THEMES,
    typeById: typeById,
    whoLabel: whoLabel,
    whoEmoji: whoEmoji,
    reminderLabel: reminderLabel
  };
})(window);
