#!/usr/bin/env node

import { createRequire } from 'module';
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

try {
  const tsxBin = require.resolve('tsx/dist/cli.mjs');
  const cliScript = path.resolve(__dirname, '../../src/cli/index.ts');

  const proc = spawn(process.execPath, [tsxBin, cliScript, ...process.argv.slice(2)], {
    stdio: 'inherit'
  });

  proc.on('exit', (code) => {
    process.exit(code ?? 0);
  });
} catch (err) {
  console.error('Failed to launch SpecKit Governance Dashboard CLI:', err);
  process.exit(4);
}
