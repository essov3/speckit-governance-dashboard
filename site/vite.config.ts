import { defineConfig, type Plugin } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, '../docs/assets/screenshots');

function screenshotsPlugin(): Plugin {
  return {
    name: 'serve-and-copy-screenshots',
    configureServer(server) {
      server.middlewares.use('/screenshots', (req, res, next) => {
        const name = path.basename((req.url ?? '').split('?')[0] || '');
        if (!name || name.includes('..')) {
          next();
          return;
        }
        const file = path.join(screenshotsDir, name);
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          next();
          return;
        }
        const ext = path.extname(file).toLowerCase();
        const type =
          ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'application/octet-stream';
        res.setHeader('Content-Type', type);
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      const out = path.resolve(__dirname, 'dist/screenshots');
      fs.mkdirSync(out, { recursive: true });
      for (const file of fs.readdirSync(screenshotsDir)) {
        if (/\.(png|svg)$/i.test(file)) {
          fs.copyFileSync(path.join(screenshotsDir, file), path.join(out, file));
        }
      }
    },
  };
}

export default defineConfig({
  root: path.resolve(__dirname),
  build: { outDir: path.resolve(__dirname, 'dist'), emptyOutDir: true },
  plugins: [screenshotsPlugin()],
});
