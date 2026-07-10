import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { resolveProjectRoot, loadConfig } from '../../core/paths/resolve-project-root.ts';
import { buildSnapshot } from '../../core/snapshot/build-snapshot.ts';
import { writeSnapshot } from '../../core/snapshot/write-snapshot.ts';
import { startReadOnlyGuard, assertNoMutation } from '../../core/validate/read-only-protection.ts';

export interface ServeCommandOptions {
  projectRoot?: string;
  port?: string;
  host?: string;
  open?: boolean;
  deterministic?: boolean;
}

export async function runServe(options: ServeCommandOptions): Promise<void> {
  console.log('SpecKit Governance Dashboard - Preparing server...');

  // 1. Resolve project root
  let projectRoot: string;
  try {
    projectRoot = resolveProjectRoot(options.projectRoot);
  } catch (err: any) {
    console.error(`Error resolving project root: ${err.message}`);
    process.exit(2);
  }

  // 2. Start read-only guard
  const guard = await startReadOnlyGuard(projectRoot);

  // 3. Load config and generate snapshot
  const config = loadConfig();
  
  let snapshot;
  try {
    snapshot = await buildSnapshot({
      projectRoot,
      deterministic: !!options.deterministic,
      strict: config.strict || false,
      adapterMode: config.adapter,
      includeUnknown: true,
      cliCommand: `serve ${process.argv.slice(3).join(' ')}`
    });
  } catch (err: any) {
    console.error(`Error generating snapshot: ${err.message}`);
    process.exit(4);
  }

  // 4. Assert no mutation
  try {
    await assertNoMutation(guard, projectRoot);
  } catch (err: any) {
    console.error(`READ-ONLY PROTECTION FAILURE: ${err.message}`);
    process.exit(1);
  }

  // 5. Write snapshot to temporary cache
  const writeResult = writeSnapshot(
    snapshot,
    projectRoot,
    undefined, // Use default safe external location
    config.output
  );

  console.log(`Snapshot generated at: ${writeResult.outputPath}`);

  // 6. Start static file HTTP server
  const port = parseInt(options.port || '5173', 10);
  const host = options.host || 'localhost';

  // Resolve UI assets for both the bundled CLI (`dist/cli/index.js`) and TSX development mode.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const bundledUiAssetsPath = path.resolve(__dirname, '../ui');
  const uiAssetsPath = fs.existsSync(bundledUiAssetsPath)
    ? bundledUiAssetsPath
    : path.resolve(process.cwd(), 'dist/ui');

  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const ALLOWED_SOURCE_EXTS = new Set(['.md', '.markdown', '.txt', '.yaml', '.yml', '.json', '.feature']);

  /**
   * Safely resolve a relative project path for read-only source viewing.
   * Blocks path traversal and files outside the SpecKit project root.
   */
  function resolveSafeSourcePath(relativePath: string): { ok: true; absolutePath: string; relativePath: string } | { ok: false; status: number; message: string } {
    if (!relativePath || typeof relativePath !== 'string') {
      return { ok: false, status: 400, message: 'Missing path parameter' };
    }

    // Normalize and strip leading slashes / drive tricks
    const cleaned = relativePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\0/g, '');
    if (cleaned.includes('..') || path.isAbsolute(cleaned) || /^[a-zA-Z]:/.test(cleaned)) {
      return { ok: false, status: 400, message: 'Invalid path' };
    }

    const absolutePath = path.resolve(projectRoot, cleaned);
    const rootResolved = path.resolve(projectRoot);

    // Ensure the file stays inside project root
    const relToRoot = path.relative(rootResolved, absolutePath);
    if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
      return { ok: false, status: 403, message: 'Path outside project root' };
    }

    const ext = path.extname(absolutePath).toLowerCase();
    if (!ALLOWED_SOURCE_EXTS.has(ext)) {
      return { ok: false, status: 403, message: `File type not allowed: ${ext || '(none)'}` };
    }

    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      return { ok: false, status: 404, message: 'File not found' };
    }

    // Size guard (2 MB)
    const size = fs.statSync(absolutePath).size;
    if (size > 2 * 1024 * 1024) {
      return { ok: false, status: 413, message: 'File too large to preview' };
    }

    return { ok: true, absolutePath, relativePath: cleaned };
  }

  const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    const url = new URL(rawUrl, `http://${host}:${port}`);
    let reqPath = url.pathname;

    // CORS-friendly JSON helpers
    const sendJson = (status: number, body: unknown) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify(body));
    };

    // Route for snapshot JSON
    if (reqPath === '/project-status.json' || reqPath === '/api/snapshot') {
      try {
        const snapshotData = fs.readFileSync(writeResult.outputPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(snapshotData);
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error loading snapshot: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
    }

    // Read-only source file content (for SpecKit markdown viewer)
    if (reqPath === '/api/file') {
      const fileParam = url.searchParams.get('path') || '';
      const resolved = resolveSafeSourcePath(fileParam);
      if (!resolved.ok) {
        sendJson(resolved.status, { error: resolved.message });
        return;
      }
      try {
        const content = fs.readFileSync(resolved.absolutePath, 'utf8');
        sendJson(200, {
          path: resolved.relativePath,
          content,
          sizeBytes: Buffer.byteLength(content, 'utf8'),
          extension: path.extname(resolved.absolutePath).toLowerCase()
        });
      } catch (err) {
        sendJson(500, { error: err instanceof Error ? err.message : String(err) });
      }
      return;
    }

    // List discoverable source files from the snapshot (markdown-first)
    if (reqPath === '/api/files') {
      try {
        const snapshotData = JSON.parse(fs.readFileSync(writeResult.outputPath, 'utf8'));
        const artifacts = Array.isArray(snapshotData.artifacts) ? snapshotData.artifacts : [];
        const files = artifacts
          .filter((a: { path?: string }) => {
            const p = (a.path || '').toLowerCase();
            return p.endsWith('.md') || p.endsWith('.markdown') || p.endsWith('.yaml') || p.endsWith('.yml') || p.endsWith('.txt');
          })
          .map((a: { path: string; role: string; featureNumber?: number; sizeBytes?: number }) => ({
            path: a.path,
            role: a.role,
            featureNumber: a.featureNumber,
            sizeBytes: a.sizeBytes
          }));
        sendJson(200, { files, projectRoot: snapshot.generated.projectRoot });
      } catch (err) {
        sendJson(500, { error: err instanceof Error ? err.message : String(err) });
      }
      return;
    }

    // Default to index.html for SPA routing fallback
    let filePath = path.join(uiAssetsPath, reqPath);
    if (reqPath === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(uiAssetsPath, 'index.html');
    }

    // Read and serve file
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  server.listen(port, host, () => {
    const url = `http://${host}:${port}`;
    console.log(`\nSpecKit Governance Dashboard is running at: ${url}`);
    console.log('Markdown is the single source of truth. Dashboard is read-only.');
    console.log('Press Ctrl+C to stop.');

    if (options.open) {
      // Try to open the URL in the default browser
      import('child_process').then(({ exec }) => {
        const cmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${cmd} ${url}`);
      }).catch(() => {
        // Ignored
      });
    }
  });
}
