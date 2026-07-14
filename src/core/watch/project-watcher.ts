import * as path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';

export type ProjectWatchEvent = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

export interface ProjectFileChange {
  event: ProjectWatchEvent;
  path: string;
}

export interface ProjectWatcherOptions {
  projectRoot: string;
  debounceMs?: number;
  ignoredPaths?: string[];
  onChange: (changes: ProjectFileChange[]) => void | Promise<void>;
}

export interface ProjectWatcher {
  ready: Promise<void>;
  close: () => Promise<void>;
}

const WATCHED_SOURCE_DIRECTORIES = ['specs', '.specify'];

const IGNORED_DIRECTORY_NAMES = new Set([
  '.dashboard-cache',
  '.git',
  '.next',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'vendor'
]);

/**
 * Returns true when a path can contribute to the generated snapshot.
 * Paths are normalized before this function is called.
 */
export function isWatchableProjectPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  const parts = normalized.split('/').filter(Boolean);

  if (parts.some((part) => IGNORED_DIRECTORY_NAMES.has(part))) {
    return false;
  }

  return WATCHED_SOURCE_DIRECTORIES.some(
    (directory) => normalized === directory || normalized.startsWith(`${directory}/`)
  );
}

/**
 * Watches only SpecKit source directories and batches editor save bursts into a
 * single callback. The watcher never writes to the target project.
 */
export function startProjectWatcher(options: ProjectWatcherOptions): ProjectWatcher {
  const projectRoot = path.resolve(options.projectRoot);
  const debounceMs = Math.max(25, options.debounceMs ?? 250);
  const watchTargets = WATCHED_SOURCE_DIRECTORIES.map((directory) => path.join(projectRoot, directory));
  const ignoredRelativePaths = (options.ignoredPaths || []).map((ignoredPath) =>
    path.relative(projectRoot, path.resolve(ignoredPath)).replace(/\\/g, '/')
  );
  const watcher: FSWatcher = chokidar.watch(watchTargets, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: Math.max(50, debounceMs),
      pollInterval: 25
    }
  });

  const pendingChanges = new Map<string, ProjectFileChange>();
  let timer: NodeJS.Timeout | undefined;

  const flush = () => {
    timer = undefined;
    const changes = [...pendingChanges.values()].sort((a, b) => a.path.localeCompare(b.path));
    pendingChanges.clear();
    if (changes.length > 0) {
      void Promise.resolve(options.onChange(changes)).catch((error) => {
        console.error(`Dashboard watch callback failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
  };

  watcher.on('all', (event, absolutePath) => {
    if (!['add', 'change', 'unlink', 'addDir', 'unlinkDir'].includes(event)) return;

    const relativePath = path.relative(projectRoot, absolutePath).replace(/\\/g, '/');
    if (!isWatchableProjectPath(relativePath)) return;
    if (ignoredRelativePaths.some((ignoredPath) => {
      if (relativePath === ignoredPath) return true;
      const ignoredDirectory = path.posix.dirname(ignoredPath);
      const ignoredBasename = path.posix.basename(ignoredPath);
      return path.posix.dirname(relativePath) === ignoredDirectory
        && path.posix.basename(relativePath).startsWith(`.${ignoredBasename}.`)
        && relativePath.endsWith('.tmp');
    })) return;

    pendingChanges.set(relativePath, {
      event: event as ProjectWatchEvent,
      path: relativePath
    });

    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  });

  const ready = new Promise<void>((resolve, reject) => {
    watcher.once('ready', resolve);
    watcher.once('error', reject);
  });

  return {
    ready,
    close: async () => {
      if (timer) clearTimeout(timer);
      pendingChanges.clear();
      await watcher.close();
    }
  };
}
