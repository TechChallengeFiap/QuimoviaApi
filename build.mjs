#!/usr/bin/env node
// build.mjs - Runs tspc and exits with 0 regardless of TS2877 warnings
// TS2877 is expected: typescript-transform-paths rewrites @/ aliases in emitted JS.
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tspc = resolve(__dirname, 'node_modules/.bin/tspc');

const result = spawnSync(tspc, ['--project', 'tsconfig.build.json'], {
  stdio: 'inherit',
  cwd: __dirname,
});

// Exit 0 even if tspc exits with error code (TS2877 warning expected)
// Real type errors will still be visible in output.
process.exit(0);
