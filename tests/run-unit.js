/* Lance tous les tests unitaires. Zéro dépendance : `node tests/run-unit.js` */
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

var files = ['dates.test.js', 'storage.test.js'];
var failed = false;

files.forEach(function (f) {
  console.log('\n=== ' + f + ' ===');
  try {
    execFileSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (err) {
    failed = true;
  }
});

if (failed) {
  console.log('\nDes tests ont échoué.');
  process.exit(1);
} else {
  console.log('\nTous les tests unitaires sont au vert.');
}
