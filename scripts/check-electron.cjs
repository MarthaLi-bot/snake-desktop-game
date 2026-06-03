const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const entry = path.join(__dirname, '..', 'electron', 'main.cjs');
const distIndex = path.join(__dirname, '..', 'dist', 'index.html');

const syntaxCheck = spawnSync(process.execPath, ['--check', entry], { stdio: 'inherit' });
if (syntaxCheck.status !== 0) {
  process.exit(syntaxCheck.status ?? 1);
}

if (!fs.existsSync(distIndex)) {
  console.error('dist/index.html was not generated.');
  process.exit(1);
}

console.log('Electron entry and Vite output are ready.');
