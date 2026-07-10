import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = 5187;
const baseUrl = `http://127.0.0.1:${port}`;
const outputDir = path.join(root, 'docs', 'assets', 'screenshots');
const captures = [
  ['Overview', 'overview.png'],
  ['Features', 'feature-tracker.png'],
  ['Phase gates', 'gate-board.png'],
  ['Coverage', 'coverage-matrix.png'],
  ['Decisions', 'decision-board.png'],
  ['Evidence', 'evidence-health.png'],
  ['Risks', 'risks-blockers.png'],
  ['Activity', 'activity-feed.png'],
  ['Artifacts', 'artifact-inventory.png'],
] as const;
const selectedCaptures = process.env.DEMO_SCREENSHOT
  ? captures.filter(([, filename]) => filename === process.env.DEMO_SCREENSHOT)
  : captures;

async function waitForServer(child: ReturnType<typeof spawn>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for the demo server. Run npm run build first.')), 20_000);
    const onData = (chunk: Buffer) => {
      if (chunk.toString().includes('running at:')) {
        clearTimeout(timeout);
        resolve();
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Demo server exited early with code ${code ?? 'unknown'}.`));
    });
  });
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const keepAlive = setInterval(() => undefined, 1_000);
  console.log('Starting synthetic demo server…');
  const server = spawn(process.execPath, ['dist/cli/index.js', 'serve', '--project-root', './examples/full-governance-demo', '--deterministic', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServer(server);
    console.log('Opening Chromium…');
    if (selectedCaptures.length === 0) throw new Error(`Unknown screenshot target: ${process.env.DEMO_SCREENSHOT}`);

    for (const [label, filename] of selectedCaptures) {
      console.log(`Capturing ${filename}…`);
      const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'] });
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 10_000 });
      await page.locator('.app-shell').waitFor({ timeout: 10_000 });
      await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
      await page.getByRole('button', { name: new RegExp(`^${label}`) }).click({ timeout: 10_000 });
      await page.locator('.content').waitFor();
      await page.waitForTimeout(100);
      console.log(`Rendering ${filename}…`);
      await page.screenshot({ path: path.join(outputDir, filename), fullPage: false });
      console.log(`Saved ${filename}.`);
      await browser.close();
    }
    console.log(`Saved ${selectedCaptures.length} screenshot(s) to ${outputDir}`);
  } finally {
    server.kill();
    clearInterval(keepAlive);
  }
}

try {
  await main();
} catch (error) {
  console.error(`Screenshot capture failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
