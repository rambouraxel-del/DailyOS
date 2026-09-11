/* ============================================================
   Petit harnais de test — zéro dépendance npm.
   Charge les fichiers vanilla de l'app dans un bac à sable Node
   (vm) avec un localStorage en mémoire, pour pouvoir tester
   Dates, Config et Storage sans navigateur.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeLocalStorage() {
  var store = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; },
    _dump: function () { return store; }
  };
}

/** Crée un contexte frais avec Config/Dates/Storage chargés, comme dans le navigateur. */
function createSandbox() {
  const sandbox = {
    console: console,
    localStorage: makeLocalStorage(),
    Object: Object, Array: Array, Date: Date, Math: Math, JSON: JSON,
    String: String, Number: Number, Boolean: Boolean, RegExp: RegExp
  };
  sandbox.window = sandbox; // les modules font (function(global){...})(window)
  sandbox.self = sandbox;
  vm.createContext(sandbox);

  var files = ['js/version.js', 'js/config.js', 'js/dates.js', 'js/storage.js'];
  files.forEach(function (f) {
    var code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    vm.runInContext(code, sandbox, { filename: f });
  });
  return sandbox;
}

var total = 0, failed = 0, currentSuite = '';

function suite(name, fn) {
  currentSuite = name;
  console.log('\n' + name);
  fn();
}

function test(name, fn) {
  total++;
  try {
    fn();
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    console.log('  ✗ ' + name);
    console.log('    ' + (err && err.message ? err.message : err));
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message || 'Assertion échouée');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error((message || 'Valeurs différentes') + ' — attendu ' + JSON.stringify(expected) + ', obtenu ' + JSON.stringify(actual));
  }
}

function summary() {
  console.log('\n' + '-'.repeat(40));
  console.log(total - failed + '/' + total + ' tests réussis');
  if (failed > 0) {
    console.log(failed + ' échec(s)');
    process.exitCode = 1;
  }
}

module.exports = { createSandbox, suite, test, assert, assertEqual, summary };
