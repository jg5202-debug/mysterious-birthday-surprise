import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run('python3', ['scripts/build-netlify.py']);
run('python3', ['scripts/build-cloudflare.py']);
for (const folder of ['src', 'build/cloudflare-source']) {
  for (const file of readdirSync(root + folder).filter(file => file.endsWith('.js')).sort()) {
    run(process.execPath, ['--check', `${folder}/${file}`]);
  }
}
for (const file of readdirSync(root + 'tests').filter(file => file.endsWith('.cjs')).sort()) {
  run(process.execPath, [`tests/${file}`]);
}
