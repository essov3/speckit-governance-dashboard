import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = ['dist/cli/index.js', 'dist/ui/index.html'];
const missing = required.filter((file) => !fs.existsSync(path.join(repoRoot, file)));

const assetsDir = path.join(repoRoot, 'dist/ui/assets');
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
if (!assets.some((file) => file.endsWith('.js'))) missing.push('dist/ui/assets/*.js');
if (!assets.some((file) => file.endsWith('.css'))) missing.push('dist/ui/assets/*.css');

if (missing.length > 0) {
  console.error(`Refusing to pack: build output is incomplete. Missing: ${missing.join(', ')}`);
  console.error('Run "npm run build" and make sure no other build is running concurrently.');
  process.exit(1);
}

console.log('verify-dist: dist/cli and dist/ui are complete.');
