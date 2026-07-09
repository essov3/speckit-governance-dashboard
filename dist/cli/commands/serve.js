import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { resolveProjectRoot, loadConfig } from '../../core/paths/resolve-project-root.ts';
import { buildSnapshot } from '../../core/snapshot/build-snapshot.ts';
import { writeSnapshot } from '../../core/snapshot/write-snapshot.ts';
import { startReadOnlyGuard, assertNoMutation } from '../../core/validate/read-only-protection.ts';
export async function runServe(options) {
    console.log('SpecKit Governance Dashboard - Preparing server...');
    // 1. Resolve project root
    let projectRoot;
    try {
        projectRoot = resolveProjectRoot(options.projectRoot);
    }
    catch (err) {
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
    }
    catch (err) {
        console.error(`Error generating snapshot: ${err.message}`);
        process.exit(4);
    }
    // 4. Assert no mutation
    try {
        await assertNoMutation(guard, projectRoot);
    }
    catch (err) {
        console.error(`READ-ONLY PROTECTION FAILURE: ${err.message}`);
        process.exit(1);
    }
    // 5. Write snapshot to temporary cache
    const writeResult = writeSnapshot(snapshot, projectRoot, undefined, // Use default safe external location
    config.output);
    console.log(`Snapshot generated at: ${writeResult.outputPath}`);
    // 6. Start static file HTTP server
    const port = parseInt(options.port || '5173', 10);
    const host = options.host || 'localhost';
    // Determine dist/ui path
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // In dev, the compiled UI is built to dist/ui, or if running directly, we can read from src/ui or build folder
    // Let's resolve the dashboard repo root
    const dashboardRoot = path.resolve(__dirname, '../../../'); // from dist/cli/commands/
    const uiAssetsPath = path.resolve(dashboardRoot, 'dist/ui');
    const mimeTypes = {
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
    const server = http.createServer((req, res) => {
        let reqPath = req.url || '/';
        // Route for snapshot JSON
        if (reqPath === '/project-status.json' || reqPath === '/api/snapshot') {
            try {
                const snapshotData = fs.readFileSync(writeResult.outputPath, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(snapshotData);
                return;
            }
            catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Error loading snapshot: ${err instanceof Error ? err.message : String(err)}`);
                return;
            }
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
            }
            else {
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
