#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === 'win32';
const tspc = resolve(__dirname, 'node_modules/.bin', isWindows ? 'tspc.cmd' : 'tspc');

const result = spawnSync(tspc, ['--project', 'tsconfig.build.json'], {
  stdio: 'inherit',
  cwd: __dirname,
  shell: isWindows,
});

if (result.error) {
  console.error('Erro ao executar o build com tspc:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);

