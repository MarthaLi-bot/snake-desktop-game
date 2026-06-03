const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const localVite = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');

if (fs.existsSync(localVite)) {
  const viteResult = spawnSync(localVite, ['build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (viteResult.status !== 0) {
    process.exit(viteResult.status ?? 1);
  }
} else {
  const dist = path.join(root, 'dist');
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  fs.copyFileSync(path.join(root, 'src', 'standalone.js'), path.join(dist, 'assets', 'standalone.js'));
  fs.copyFileSync(path.join(root, 'src', 'styles.css'), path.join(dist, 'assets', 'styles.css'));
  fs.writeFileSync(path.join(dist, 'index.html'), `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>像素贪吃蛇</title>
    <script type="module" crossorigin src="./assets/standalone.js"></script>
    <link rel="stylesheet" crossorigin href="./assets/styles.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`);
  console.log('Vite is not installed in this environment; generated equivalent offline dist fallback.');
}

const electronCheck = spawnSync(process.execPath, [path.join(root, 'scripts', 'check-electron.cjs')], { cwd: root, stdio: 'inherit' });
if (electronCheck.status !== 0) {
  process.exit(electronCheck.status ?? 1);
}
