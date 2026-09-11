/* ============================================================
   Themes — application du thème choisi
   ============================================================ */
(function (global) {
  'use strict';

  var DARK_THEMES = { dark: true, space: true };

  function apply(themeId) {
    var valid = Config.THEMES.some(function (t) { return t.id === themeId; });
    var id = valid ? themeId : 'love';
    document.documentElement.setAttribute('data-theme', id);
    // Indique au navigateur le rendu attendu pour les contrôles natifs
    // (sélecteurs de date/heure, cases à cocher…) : sans cela, un thème
    // sombre peut se retrouver avec des pickers natifs clairs illisibles.
    document.documentElement.style.colorScheme = DARK_THEMES[id] ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var color = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg').trim();
      if (color) meta.setAttribute('content', color);
    }
  }

  global.Themes = { apply: apply };
})(window);
