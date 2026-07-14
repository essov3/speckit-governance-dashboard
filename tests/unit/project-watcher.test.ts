import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  isWatchableProjectPath,
  startProjectWatcher,
  type ProjectFileChange,
  type ProjectWatcher
} from '../../src/core/watch/project-watcher.ts';

const temporaryRoots: string[] = [];
const activeWatchers: ProjectWatcher[] = [];

afterEach(async () => {
  await Promise.all(activeWatchers.splice(0).map((watcher) => watcher.close()));
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('project source watcher', () => {
  it('only accepts paths that can contribute to a SpecKit snapshot', () => {
    expect(isWatchableProjectPath('specs/001-login/spec.md')).toBe(true);
    expect(isWatchableProjectPath('.specify/feature.json')).toBe(true);
    expect(isWatchableProjectPath('specs/001-login/.dashboard-cache/status.json')).toBe(false);
    expect(isWatchableProjectPath('specs/001-login/node_modules/package.json')).toBe(false);
    expect(isWatchableProjectPath('README.md')).toBe(false);
    expect(isWatchableProjectPath('src/index.ts')).toBe(false);
  });

  it('reports a source edit after the file becomes stable', async () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-watch-'));
    temporaryRoots.push(projectRoot);
    fs.mkdirSync(path.join(projectRoot, 'specs', '001-login'), { recursive: true });

    let resolveChanges!: (changes: ProjectFileChange[]) => void;
    const changesReceived = new Promise<ProjectFileChange[]>((resolve) => {
      resolveChanges = resolve;
    });

    const watcher = startProjectWatcher({
      projectRoot,
      debounceMs: 25,
      onChange: resolveChanges
    });
    activeWatchers.push(watcher);
    await watcher.ready;
    // Give the underlying platform watcher one event-loop turn after its initial scan.
    await new Promise((resolve) => setTimeout(resolve, 100));

    fs.writeFileSync(path.join(projectRoot, 'specs', '001-login', 'spec.md'), '# Login\n', 'utf8');

    const changes = await Promise.race([
      changesReceived,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Watcher timed out')), 2_000))
    ]);

    expect(changes).toContainEqual({ event: 'add', path: 'specs/001-login/spec.md' });
  });

  it('ignores a configured derived snapshot inside a watched directory', async () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-watch-output-'));
    temporaryRoots.push(projectRoot);
    fs.mkdirSync(path.join(projectRoot, 'specs'), { recursive: true });
    const outputPath = path.join(projectRoot, 'specs', 'project-status.json');
    let callbackCount = 0;

    const watcher = startProjectWatcher({
      projectRoot,
      debounceMs: 25,
      ignoredPaths: [outputPath],
      onChange: () => {
        callbackCount += 1;
      }
    });
    activeWatchers.push(watcher);
    await watcher.ready;
    await new Promise((resolve) => setTimeout(resolve, 100));

    fs.writeFileSync(outputPath, '{}\n', 'utf8');
    fs.writeFileSync(path.join(projectRoot, 'specs', '.project-status.json.123.tmp'), '{}\n', 'utf8');
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(callbackCount).toBe(0);
  });
});
