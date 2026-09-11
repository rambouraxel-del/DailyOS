/* ============================================================
   Themes — application du thème choisi
   ============================================================ */
(function (global) {
  'use strict';

  function apply(themeId) {
    var valid = Config.THEMES.some(function (t) { return t.id === themeId; });
    var id = valid ? themeId : 'love';
    document.documentElement.setAttribute('data-theme', id);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var color = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg').trim();
      if (color) meta.setAttribute('content', color);
    }
  }

  global.Themes = { apply: apply };
})(window);
