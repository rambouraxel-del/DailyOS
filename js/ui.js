/* ============================================================
   UI — petits utilitaires DOM partagés
   ============================================================ */
(function (global) {
  'use strict';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style') node.setAttribute('style', v);
        else if (k.indexOf('on') === 0 && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else node.setAttribute(k, v);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  var toastTimer = null;
  function toast(message) {
    var host = document.getElementById('toast');
    if (!host) return;
    host.textContent = message;
    host.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      host.classList.remove('is-visible');
    }, 2400);
  }

  function confirmBox(message) {
    return global.confirm(message);
  }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /** Piège la navigation Tab/Shift+Tab à l'intérieur de `container`.
      Retourne une fonction à appeler pour relâcher le piège. */
  function trapFocus(container) {
    function onKeydown(e) {
      if (e.key !== 'Tab') return;
      var focusables = Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE))
        .filter(function (n) { return n.offsetParent !== null; });
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    container.addEventListener('keydown', onKeydown);
    return function release() {
      container.removeEventListener('keydown', onKeydown);
    };
  }

  /** Boîte de dialogue de confirmation intégrée à l'interface (mêmes
      thèmes, mêmes composants) — remplace window.confirm(). */
  var confirmOverlay = null;
  function confirmDialog(options) {
    options = options || {};
    var previousFocus = document.activeElement;
    var release = null;

    function close(result) {
      if (release) release();
      if (!confirmOverlay) return;
      var node = confirmOverlay;
      node.classList.remove('is-open');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 180);
      confirmOverlay = null;
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
      if (result && options.onConfirm) options.onConfirm();
      if (!result && options.onCancel) options.onCancel();
    }

    var card = el('div', { class: 'confirm-card', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': options.title || 'Confirmation' }, [
      options.title ? el('h3', { class: 'confirm-title', text: options.title }) : null,
      el('p', { class: 'confirm-message', text: options.message || '' }),
      el('div', { class: 'confirm-actions' }, [
        el('button', {
          class: 'btn btn-ghost', type: 'button', text: options.cancelLabel || 'Annuler',
          onclick: function () { close(false); }
        }),
        el('button', {
          class: 'btn ' + (options.danger ? 'btn-danger-solid' : 'btn-primary'), type: 'button',
          text: options.confirmLabel || 'Confirmer',
          onclick: function () { close(true); }
        })
      ])
    ]);

    confirmOverlay = el('div', {
      class: 'overlay overlay-center',
      onclick: function (e) { if (e.target === confirmOverlay) close(false); }
    }, [card]);

    document.body.appendChild(confirmOverlay);
    requestAnimationFrame(function () { confirmOverlay.classList.add('is-open'); });
    release = trapFocus(card);
    setTimeout(function () {
      var btn = card.querySelector('.btn-ghost');
      if (btn) btn.focus();
    }, 180);

    function onKeydown(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKeydown);
        close(false);
      }
    }
    document.addEventListener('keydown', onKeydown);
  }

  global.UI = {
    el: el, clear: clear, toast: toast, confirmBox: confirmBox,
    trapFocus: trapFocus, confirmDialog: confirmDialog
  };
})(window);
